import * as t from 'io-ts'

import { 
    INFORMATION_SCHEMA, 
    INFORMATION_SCHEMA_COLUMN, 
    TABLE_TYPE_Type,
    TABLE_TYPE, 
    IInformationSchemaReader 
} from './INFORMATION_SCHEMA';
import { groupBy } from './utils';

export const ObjectNameType = t.type({
    db_name: t.string,
    schema: t.string,
    name: t.string
})

export type ObjectName = t.TypeOf<typeof ObjectNameType>

export const ManyToOneType = t.type({
    constraint_name: ObjectNameType,
    parent_table: ObjectNameType,
    column_map: t.array(t.type({
        column: t.string,
        parent_column: t.string
    }))
})

export type ManyToOne = t.TypeOf<typeof ManyToOneType>

export const OneToManyType = t.type({
    constraint_name: ObjectNameType,
    child_table: ObjectNameType,
    column_map: t.array(t.type({
        column: t.string,
        child_column: t.string
    }))
})

export type OneToMany = t.TypeOf<typeof OneToManyType>

export const OneToOneType = t.type({
    constraint_name: ObjectNameType,
    sibling_table: ObjectNameType,
    column_map: t.array(t.type({
        column: t.string,
        sibling_column: t.string
    }))
})

export type OneToOne = t.TypeOf<typeof OneToOneType>

export const UniqueConstraintType = t.type({
    name: ObjectNameType,
    table: ObjectNameType,
    columns: t.array(t.string)
})

export type UniqueConstraint = t.TypeOf<typeof UniqueConstraintType>

export const ColumnSchemaType = t.type({
    name: t.string,
    is_nullable: t.boolean,
    is_identity: t.boolean,
    db_type: t.string,
    db_default: t.union([t.string, t.null]),
    max_length: t.union([t.number, t.null])
})

export type ColumnSchema = t.TypeOf<typeof ColumnSchemaType>

export const TableSchemaType = t.type({
    name: ObjectNameType,
    type: TABLE_TYPE_Type,
    columns: t.array(ColumnSchemaType),
    primary_keys: t.array(t.string),
    many_to_ones: t.array(ManyToOneType),
    one_to_manys: t.array(OneToManyType),
    one_to_ones: t.array(OneToOneType),
    unique_constraints: t.array(UniqueConstraintType)
})

export type TableSchema = t.TypeOf<typeof TableSchemaType>

export const DBSchemaType = t.type({
    name: t.string,
    tables: t.array(TableSchemaType)
})

export type DBSchema = t.TypeOf<typeof DBSchemaType>

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

function MapColumn(column: INFORMATION_SCHEMA_COLUMN): ColumnSchema {
    return {
        name: column.COLUMN_NAME,
        is_nullable: column.IS_NULLABLE === 'YES',
        is_identity: column.IS_IDENTITY === 'YES' || column.IS_IDENTITY === true ? true : false,
        db_type: column.DATA_TYPE,
        db_default: column.COLUMN_DEFAULT,
        max_length: column.CHARACTER_MAXIMUM_LENGTH
    };
}

function MapColumns(info: INFORMATION_SCHEMA, name: ObjectName){
    const columns = info.columns
                        .filter(c => c.TABLE_CATALOG === name.db_name && c.TABLE_SCHEMA === name.schema && c.TABLE_NAME == name.name)
                        .map(MapColumn);
    return columns;
}

function MapTable(info: INFORMATION_SCHEMA, name: ObjectName, type: TABLE_TYPE): TableSchema
{
    const primaryKeys = GetPrimaryKeyColumns(info, name);
    const uniqueConstraints = GetUniqueConstraints(info, name);
    const columns = MapColumns(info, name);
    
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

