import { INFORMATION_SCHEMA, INFORMATION_SCHEMA_CONSTRAINT, CONSTRAINT_TYPE, INFORMATION_SCHEMA_COLUMN, INFORMATION_SCHEMA_TABLE, TABLE_TYPE, IInformationSchemaReader } from './INFORMATION_SCHEMA';
import { groupBy } from './utils';


export { IInformationSchemaReader } from './INFORMATION_SCHEMA';
export { SqlServerInformationSchemaReader } from './providers/sqlserver';
export { FileInformationSchemaReader } from './providers/filereader';

export type ObjectName = {
    db_name: string;
    schema: string;
    name: string;
}

export type ManyToOne = {
    constraint_name: ObjectName;
    parent_table: ObjectName;
    column_map: Array<{
        column: string,
        parent_column: string
    }>
}

export type OneToMany = {
    constraint_name: ObjectName;
    child_table: ObjectName;
    column_map: Array<{
        column: string,
        child_column: string
    }>
}

export type OneToOne = {
    constraint_name: ObjectName;
    sibling_table: ObjectName;
    column_map: Array<{
        column: string,
        sibling_column: string
    }>
}

export type UniqueConstraint = {
    name: ObjectName;
    table: ObjectName;
    columns: string[];
}

export type ColumnSchema = {
    name: string;
    is_nullable: boolean;
    is_identity: boolean;
    is_part_of_primary_key: boolean;
    is_only_primary_key: boolean;
    is_part_of_unique_constraint: boolean;
    is_only_member_of_unique_constraint: boolean;
    db_type: string;
    max_length: number | null;
}

export type TableSchema = {
    name: ObjectName;
    type: TABLE_TYPE;
    columns: ColumnSchema[];
    primary_keys: string[];
    many_to_ones: ManyToOne[];
    one_to_manys: OneToMany[];
    one_to_ones: OneToOne[];
    unique_constraints: UniqueConstraint[];
}

export type DBSchema = {
    name: string;
    tables: TableSchema[]
}

function GetPrimaryKeyColumns(info: INFORMATION_SCHEMA, name: ObjectName): string[] {
    const primaryKeys = info.constraints.filter(c => c.CONSTRAINT_TYPE === 'PRIMARY KEY' && c.TABLE_CATALOG === name.db_name && c.TABLE_SCHEMA === name.schema && c.TABLE_NAME === name.name);
    return primaryKeys.map(pk => pk.COLUMN_NAME);
}

function GetManyToOnes(info: INFORMATION_SCHEMA, name: ObjectName, oneToOnes: OneToOne[]): ManyToOne[] {
    const foreignKeys = info.constraints
                            .filter(c => c.CONSTRAINT_TYPE === 'FOREIGN KEY' 
                                && (
                                    (c.TABLE_CATALOG === name.db_name && c.TABLE_SCHEMA === name.schema && c.TABLE_NAME === name.name)
                                )
                            );

    const group = groupBy(foreignKeys, fk => fk.CONSTRAINT_CATALOG + '.' + fk.CONSTRAINT_SCHEMA + '.' + fk.CONSTRAINT_NAME);

    return Object.keys(group).map(k => {
        if(oneToOnes.some(oto => oto.constraint_name.db_name + '.' + oto.constraint_name.schema + '.' + oto.constraint_name.name === k))
        {
            return null;
        }

        const entries = group[k];
        if(entries.length < 1)
        {
            return null;
        }
        const first = entries[0];
        if(first.FK_TABLE_CATALOG === null || first.FK_TABLE_SCHEMA === null || first.FK_TABLE_NAME === null) {
            return null;
        }

        const column_map = entries.map(fk => { return { column: fk.COLUMN_NAME, parent_column: fk.FK_COLUMN_NAME! } });
        return {
            parent_table: {
                db_name: first.FK_TABLE_CATALOG,
                schema: first.FK_TABLE_SCHEMA,
                name: first.FK_TABLE_NAME
            },
            constraint_name: {
                db_name: first.CONSTRAINT_CATALOG,
                schema: first.CONSTRAINT_SCHEMA,
                name: first.CONSTRAINT_NAME
            },
            column_map: column_map
        };
    }).filter(mto => mto !== null).map(mto => mto!);
}

function GetOneToManys(info: INFORMATION_SCHEMA, name: ObjectName, oneToOnes: OneToOne[]): OneToMany[] {
    const foreignKeys = info.constraints
                            .filter(c => c.CONSTRAINT_TYPE === 'FOREIGN KEY' 
                                && (
                                    (c.FK_TABLE_CATALOG === name.db_name && c.FK_TABLE_SCHEMA === name.schema && c.FK_TABLE_NAME === name.name)
                                )
                            );

    const group = groupBy(foreignKeys, fk => fk.CONSTRAINT_CATALOG + '.' + fk.CONSTRAINT_SCHEMA + '.' + fk.CONSTRAINT_NAME);

    return Object.keys(group).map(k => {
        if(oneToOnes.some(oto => oto.constraint_name.db_name + '.' + oto.constraint_name.schema + '.' + oto.constraint_name.name === k))
        {
            return null;
        }

        const entries = group[k];
        if(entries.length < 1)
        {
            return null;
        }
        const first = entries[0];
        if(first.FK_TABLE_CATALOG === null || first.FK_TABLE_SCHEMA === null || first.FK_TABLE_NAME === null) {
            return null;
        }

        const column_map = entries.map(fk => { return { column: fk.FK_COLUMN_NAME!, child_column: fk.COLUMN_NAME } });
        return {
            child_table: {
                db_name: first.TABLE_CATALOG,
                schema: first.TABLE_SCHEMA,
                name: first.TABLE_NAME
            },
            constraint_name: {
                db_name: first.CONSTRAINT_CATALOG,
                schema: first.CONSTRAINT_SCHEMA,
                name: first.CONSTRAINT_NAME
            },
            column_map: column_map
        };
    }).filter(mto => mto !== null).map(mto => mto!);
}

function GetOneToOnes(info: INFORMATION_SCHEMA, name: ObjectName, columns: ColumnSchema[], primaryKeys: string[]): OneToOne[] {
    const foreignKeys = info.constraints
                            .filter(c => c.CONSTRAINT_TYPE === 'FOREIGN KEY' 
                                && (
                                    (c.TABLE_CATALOG === name.db_name && c.TABLE_SCHEMA === name.schema && c.TABLE_NAME === name.name)
                                    || (c.FK_TABLE_CATALOG === name.db_name && c.FK_TABLE_SCHEMA === name.schema && c.FK_TABLE_NAME === name.name)
                                )
                            );

    const group = groupBy(foreignKeys, fk => fk.CONSTRAINT_CATALOG + '.' + fk.CONSTRAINT_SCHEMA + '.' + fk.CONSTRAINT_NAME);

    return Object.keys(group).map(k => {
        const entries = group[k];
        if(entries.length < 1)
        {
            return null;
        }

        const first = entries[0];
        if(first.FK_TABLE_CATALOG === null || first.FK_TABLE_SCHEMA === null || first.FK_TABLE_NAME === null) {
            return null;
        }

        const isLeftSide = first.TABLE_CATALOG === name.db_name && first.TABLE_SCHEMA === name.schema && first.TABLE_NAME === name.name;
        const isRightSide = first.FK_TABLE_CATALOG === name.db_name && first.FK_TABLE_SCHEMA === name.schema && first.FK_TABLE_NAME === name.name;

        if(isLeftSide && isRightSide){
            return null;
        }

        if(isLeftSide && !entries.every(e => primaryKeys.indexOf(e.COLUMN_NAME) !== -1))
        {
            return null;
        }

        if(isRightSide && !entries.every(e => primaryKeys.indexOf(e.FK_COLUMN_NAME!) !== -1))
        {
            return null;
        }

        const siblingPrimaryKeys = GetPrimaryKeyColumns(info, isRightSide ? { db_name: first.TABLE_CATALOG, schema: first.TABLE_SCHEMA, name: first.TABLE_NAME } : { db_name: first.FK_TABLE_CATALOG, schema: first.FK_TABLE_SCHEMA, name: first.FK_TABLE_NAME });

        if(primaryKeys.length !== siblingPrimaryKeys.length)
        {
            return null;
        }

        if(isLeftSide && !entries.every(e => siblingPrimaryKeys.indexOf(e.FK_COLUMN_NAME!) !== -1))
        {
            return null;
        }

        if(isRightSide && !entries.every(e => siblingPrimaryKeys.indexOf(e.COLUMN_NAME) !== -1))
        {
            return null;
        }

        const column_map = entries.map(fk => { return { column: isLeftSide ? fk.COLUMN_NAME : fk.FK_COLUMN_NAME!, sibling_column: isRightSide ? fk.COLUMN_NAME : fk.FK_COLUMN_NAME! } });
        return {
            sibling_table: {
                db_name: isLeftSide ? first.FK_TABLE_CATALOG : first.TABLE_CATALOG,
                schema: isLeftSide ? first.FK_TABLE_SCHEMA : first.TABLE_SCHEMA,
                name: isLeftSide ? first.FK_TABLE_NAME : first.TABLE_NAME
            },
            constraint_name: {
                db_name: first.CONSTRAINT_CATALOG,
                schema: first.CONSTRAINT_SCHEMA,
                name: first.CONSTRAINT_NAME
            },
            column_map: column_map
        };
    }).filter(oto => oto !== null).map(oto => oto!);
}

function GetUniqueConstraints(info: INFORMATION_SCHEMA, name: ObjectName): UniqueConstraint[] {
    const uniqueConstraints = info.constraints
                            .filter(c => c.CONSTRAINT_TYPE === 'UNIQUE' 
                                && (
                                    (c.TABLE_CATALOG === name.db_name && c.TABLE_SCHEMA === name.schema && c.TABLE_NAME === name.name)
                                )
                            );

    const group = groupBy(uniqueConstraints, fk => fk.CONSTRAINT_CATALOG + '.' + fk.CONSTRAINT_SCHEMA + '.' + fk.CONSTRAINT_NAME);

    return Object.keys(group).map(k => {
        const entries = group[k];
        if(entries.length < 1)
        {
            return null;
        }
        const first = entries[0];

        const columns = entries.map(c => c.COLUMN_NAME);
        return {
            name: {
                db_name: first.CONSTRAINT_CATALOG,
                schema: first.CONSTRAINT_SCHEMA,
                name: first.CONSTRAINT_NAME
            },
            table: {
                db_name: first.TABLE_CATALOG,
                schema: first.TABLE_SCHEMA,
                name: first.TABLE_NAME
            },
            columns: columns
        };
    }).filter(mto => mto !== null).map(mto => mto!);
}

function MapColumn(column: INFORMATION_SCHEMA_COLUMN, primaryKeys: string[], uniqueConstraints: UniqueConstraint[]): ColumnSchema {
    const isPartOfPrimaryKey = primaryKeys.indexOf(column.COLUMN_NAME) !== -1;
    const isOnlyPrimaryKey = isPartOfPrimaryKey && primaryKeys.length === 1;
    const is_part_of_unique_constraint = uniqueConstraints.some(uc => uc.columns.indexOf(column.COLUMN_NAME) !== -1);
    const is_only_member_of_unique_constraint = uniqueConstraints.some(uc => uc.columns.indexOf(column.COLUMN_NAME) !== -1 && uc.columns.length === 1);

    return {
        name: column.COLUMN_NAME,
        is_nullable: column.IS_NULLABLE === 'YES',
        is_identity: column.IS_IDENTITY,
        is_part_of_primary_key: isPartOfPrimaryKey,
        is_only_primary_key: isOnlyPrimaryKey,
        is_part_of_unique_constraint: is_part_of_unique_constraint,
        is_only_member_of_unique_constraint: is_only_member_of_unique_constraint,
        db_type: column.DATA_TYPE,
        max_length: column.CHARACTER_MAXIMUM_LENGTH
    };
}

function MapColumns(info: INFORMATION_SCHEMA, name: ObjectName, primaryKeys: string[], uniqueConstraints: UniqueConstraint[]){
    const columns = info.columns.filter(c => c.TABLE_CATALOG === name.db_name && c.TABLE_SCHEMA === name.schema && c.TABLE_NAME == name.name).map(c => MapColumn(c, primaryKeys, uniqueConstraints));
    return columns;
}

function MapTable(info: INFORMATION_SCHEMA, name: ObjectName, type: TABLE_TYPE): TableSchema
{
    const primaryKeys = GetPrimaryKeyColumns(info, name);
    const uniqueConstraints = GetUniqueConstraints(info, name);
    const columns = MapColumns(info, name, primaryKeys, uniqueConstraints);
    
    const oneToOnes = GetOneToOnes(info, name, columns, primaryKeys);
    const manyToOnes = GetManyToOnes(info, name, oneToOnes);
    const oneToManys = GetOneToManys(info, name, oneToOnes);
    return {
        name: name,
        type: type,
        columns: columns,
        primary_keys: primaryKeys,
        many_to_ones: manyToOnes,
        one_to_manys: oneToManys,
        one_to_ones: oneToOnes,
        unique_constraints: uniqueConstraints
    };
}

function MapTables(info: INFORMATION_SCHEMA): TableSchema[] {
    const tables = info.tables.map(ist => MapTable(info, { db_name: ist.TABLE_CATALOG, schema: ist.TABLE_SCHEMA, name: ist.TABLE_NAME }, ist.TABLE_TYPE));
    return tables;
}

function MapToFriendlySchema(info: INFORMATION_SCHEMA): DBSchema {
    const tables = MapTables(info);
    return {
        name: info.db_name,
        tables: tables
    };
}

export async function getDBSchema(reader: IInformationSchemaReader): Promise<DBSchema | null> {
    const info_schema = await reader.read();
    if(info_schema === null)
    {
        return null;
    }

    return MapToFriendlySchema(info_schema);
}

