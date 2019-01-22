import * as mssql from 'mssql/msnodesqlv8';
import { PathReporter } from 'io-ts/lib/PathReporter'

import { getDBSchema as internalGetDBSchema, DBSchema } from 'dbschema-inator'

import { 
    IInformationSchemaReader, 
    INFORMATION_SCHEMA_TABLE_Type,
    INFORMATION_SCHEMA_TABLE, 
    INFORMATION_SCHEMA_COLUMN_Type,
    INFORMATION_SCHEMA_COLUMN, 
    INFORMATION_SCHEMA_CONSTRAINT_Type,
    INFORMATION_SCHEMA_CONSTRAINT, 
    INFORMATION_SCHEMA 
} from 'dbschema-inator/lib/INFORMATION_SCHEMA';

export async function getTableSchema(conn: mssql.ConnectionPool): Promise<INFORMATION_SCHEMA_TABLE[]> {
    let res = await conn.query`select * from INFORMATION_SCHEMA.TABLES`;

    return res.recordset.map(r => {
        const res = INFORMATION_SCHEMA_TABLE_Type.decode(r)
        if(res.isLeft())
        {
            throw new Error('Invalid INFORMATION_SCHEMA_TABLE: ' + PathReporter.report(res));
        }

        return res.value
    });
}

/*
TABLE_SCHEMA: t.string,
    TABLE_NAME: t.string,
    COLUMN_NAME: t.string,
    COLUMN_DEFAULT: t.union([t.string, t.null]),
    ORDINAL_POSITION: t.number,
    IS_NULLABLE: t.union([t.literal('YES'), t.literal('NO')]),
    DATA_TYPE: t.string,
    CHARACTER_MAXIMUM_LENGTH: t.union([t.number, t.null]),
    CHARACTER_OCTET_LENGTH: t.union([t.number, t.null]),
    NUMERIC_PRECISION: t.union([t.number, t.null]),
    NUMERIC_PRECISION_RADIX: t.union([t.number, t.null]),
    NUMERIC_SCALE: t.union([t.number, t.null]),
    IS_IDENTITY: t.union([t.literal('YES'), t.literal('NO'), t.boolean])
*/

export async function getColumnSchema(conn: mssql.ConnectionPool): Promise<INFORMATION_SCHEMA_COLUMN[]> {
    let res = await conn.query`
    select 
        TABLE_CATALOG,
        TABLE_SCHEMA,
        TABLE_NAME,
        COLUMN_NAME,
        COLUMN_DEFAULT,
        ORDINAL_POSITION,
        IS_NULLABLE,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        CHARACTER_OCTET_LENGTH,
        NUMERIC_PRECISION,
        NUMERIC_PRECISION_RADIX,
        NUMERIC_SCALE,
        CONVERT(bit, CASE WHEN COLUMNPROPERTY(OBJECT_ID(Table_Name),[Column_name],'IsIdentity') = 1 then 1 else 0 end) AS IS_IDENTITY 
    from INFORMATION_SCHEMA.COLUMNS`;

    return res.recordset.map(r => {
        const res = INFORMATION_SCHEMA_COLUMN_Type.decode(r)
        if(res.isLeft())
        {
            throw new Error('Invalid INFORMATION_SCHEMA_COLUMN: ' + PathReporter.report(res));
        }

        return res.value
    });
}

export async function getConstraints(conn: mssql.ConnectionPool): Promise<INFORMATION_SCHEMA_CONSTRAINT[]> {
    let res = await conn.query`with Constraints as (SELECT DISTINCT
        cons.CONSTRAINT_CATALOG,
        cons.CONSTRAINT_SCHEMA,
        cons.CONSTRAINT_NAME, 
        cons.CONSTRAINT_TYPE,
        keycolumns.TABLE_CATALOG,
        keycolumns.TABLE_SCHEMA,
        keycolumns.TABLE_NAME, 
        keycolumns.COLUMN_NAME, 
        keycolumns.ORDINAL_POSITION, 
        refs.UNIQUE_CONSTRAINT_CATALOG,
        refs.UNIQUE_CONSTRAINT_SCHEMA,
        refs.UNIQUE_CONSTRAINT_NAME, 
        cons2.TABLE_CATALOG AS FK_TABLE_CATALOG,
        cons2.table_schema AS FK_TABLE_SCHEMA,
        cons2.table_name AS FK_TABLE_NAME,
        keycolumns2.COLUMN_NAME as FK_COLUMN_NAME,
        refs.delete_rule AS DELETE_RULE,
        refs.update_rule AS UPDATE_RULE
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS cons
            INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS keycolumns
                ON (cons.constraint_catalog = keycolumns.constraint_catalog
                    OR cons.constraint_catalog IS NULL) AND
                cons.constraint_schema = keycolumns.constraint_schema AND
                cons.constraint_name = keycolumns.constraint_name AND
                cons.table_name = keycolumns.table_name
            LEFT OUTER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS refs
                ON (cons.constraint_catalog = refs.constraint_catalog
                    OR cons.constraint_catalog IS NULL) AND
                cons.constraint_schema = refs.constraint_schema AND
                cons.constraint_name = refs.constraint_name
            LEFT OUTER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS cons2
                ON (cons2.constraint_catalog = refs.constraint_catalog
                    OR cons2.constraint_catalog IS NULL) AND
                cons2.constraint_schema = refs.unique_constraint_schema AND
                cons2.constraint_name = refs.unique_constraint_name
            LEFT OUTER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS keycolumns2
                ON (cons2.constraint_catalog = keycolumns2.constraint_catalog
                    OR cons2.constraint_catalog IS NULL) AND
                cons2.constraint_schema = keycolumns2.constraint_schema AND
                cons2.constraint_name = keycolumns2.constraint_name AND
                cons2.table_name = keycolumns2.table_name
                and keycolumns.ORDINAL_POSITION = keycolumns2.ORDINAL_POSITION
        )
        SELECT * FROM Constraints
        ORDER BY
            constraint_schema, table_name, constraint_name, ordinal_position`;

    return res.recordset.map(r => {
        const res = INFORMATION_SCHEMA_CONSTRAINT_Type.decode(r)
        if(res.isLeft())
        {
            throw new Error('Invalid INFORMATION_SCHEMA_CONSTRAINT: ' + PathReporter.report(res));
        }

        return res.value
    });;
}



async function getInformationSchema(conn: mssql.ConnectionPool): Promise<INFORMATION_SCHEMA | null> {
    const tables = await getTableSchema(conn);
    const columns = await getColumnSchema(conn);
    const constraints = await getConstraints(conn);
    const first_table = tables.length > 0 ? tables[0] : null;
    if (first_table == null) {
        return null;
    }

    return {
        db_name: first_table.TABLE_CATALOG,
        tables: tables,
        columns: columns,
        constraints: constraints
    };
}

export class SqlServerInformationSchemaReader implements IInformationSchemaReader {

    constructor(protected config: mssql.config) { }

    private async connect(): Promise<mssql.ConnectionPool> {
        return new Promise<mssql.ConnectionPool>((resolve, reject) => {
            const db = new mssql.ConnectionPool(this.config, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve(db);
                }
            });
        });
    }

    public async read() {
        const db = await this.connect();
        const schema = await getInformationSchema(db);
        await db.close();
        return schema;
    }
}

export async function getDBSchema(config: mssql.config): Promise<DBSchema | null> {
    const reader = new SqlServerInformationSchemaReader(config);
    const schema = await internalGetDBSchema(reader);
    return schema;
}