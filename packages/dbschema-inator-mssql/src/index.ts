import * as mssql from 'mssql/msnodesqlv8';

import { IInformationSchemaReader, INFORMATION_SCHEMA_TABLE, INFORMATION_SCHEMA_COLUMN, INFORMATION_SCHEMA_CONSTRAINT, INFORMATION_SCHEMA } from 'dbschema-inator';

export async function getTableSchema(conn: mssql.ConnectionPool): Promise<INFORMATION_SCHEMA_TABLE[]> {
    let res = await conn.query`select * from INFORMATION_SCHEMA.TABLES`;
    
    return res.recordset;
}

export async function getColumnSchema(conn: mssql.ConnectionPool): Promise<INFORMATION_SCHEMA_COLUMN[]> {
    let res = await conn.query`select *, CONVERT(bit, CASE WHEN COLUMNPROPERTY(OBJECT_ID(Table_Name),[Column_name],'IsIdentity') = 1 then 1 else 0 end) AS IS_IDENTITY from INFORMATION_SCHEMA.COLUMNS`;
    
    return res.recordset;
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
    
    return res.recordset;
}



async function getDBSchema(conn: mssql.ConnectionPool): Promise<INFORMATION_SCHEMA | null> {
    const tables = await getTableSchema(conn);
    const columns = await getColumnSchema(conn);
    const constraints = await getConstraints(conn);
    const first_table = tables.length > 0 ? tables[0] : null;
    if(first_table == null)
    {
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

    constructor(protected config: mssql.config) {}

    private async connect(): Promise<mssql.ConnectionPool> {
        return new Promise<mssql.ConnectionPool>((resolve, reject) => {
            const db = new mssql.ConnectionPool(this.config, err => {
                if (err) {
                    console.error("Connection failed.", err);
                    reject(err);
                } else {
                    console.log("Database pool #1 connected.");
                    resolve(db);
                }
            });
        });
    }

    public async read() {
        const db = await this.connect();
        const schema = await getDBSchema(db);
        await db.close();
        return schema;
    }
}