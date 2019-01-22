import * as t from 'io-ts'

export const TABLE_TYPE_Type = t.union([t.literal("BASE TABLE"), t.literal("VIEW")])
export type TABLE_TYPE = t.TypeOf<typeof TABLE_TYPE_Type>

export const INFORMATION_SCHEMA_TABLE_Type = t.type({
    TABLE_CATALOG: t.string,
    TABLE_SCHEMA: t.string,
    TABLE_NAME: t.string,
    TABLE_TYPE: TABLE_TYPE_Type
})

export type INFORMATION_SCHEMA_TABLE = t.TypeOf<typeof INFORMATION_SCHEMA_TABLE_Type>

export const INFORMATION_SCHEMA_COLUMN_Type = t.type({
    TABLE_CATALOG: t.string,
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
})

export type INFORMATION_SCHEMA_COLUMN = t.TypeOf<typeof INFORMATION_SCHEMA_COLUMN_Type>

export const CONSTRAINT_TYPE_Type = t.union([t.literal('PRIMARY KEY'), t.literal('FOREIGN KEY'), t.literal('UNIQUE')])

export type CONSTRAINT_TYPE = t.TypeOf<typeof CONSTRAINT_TYPE_Type>

export const INFORMATION_SCHEMA_CONSTRAINT_Type = t.type({
    CONSTRAINT_CATALOG: t.string,
    CONSTRAINT_SCHEMA: t.string,
    CONSTRAINT_NAME: t.string,
    CONSTRAINT_TYPE: CONSTRAINT_TYPE_Type,
    TABLE_CATALOG: t.string,
    TABLE_SCHEMA: t.string,
    TABLE_NAME: t.string,
    COLUMN_NAME: t.string,
    ORDINAL_POSITION: t.number,
    UNIQUE_CONSTRAINT_CATALOG: t.union([t.string, t.null]),
    UNIQUE_CONSTRAINT_SCHEMA: t.union([t.string, t.null]),
    UNIQUE_CONSTRAINT_NAME: t.union([t.string, t.null]),
    FK_TABLE_CATALOG: t.union([t.string, t.null]),
    FK_TABLE_SCHEMA: t.union([t.string, t.null]),
    FK_TABLE_NAME: t.union([t.string, t.null]),
    FK_COLUMN_NAME: t.union([t.string, t.null]),
    DELETE_RULE: t.union([t.string, t.null]),
    UPDATE_RULE: t.union([t.string, t.null]),
})

export type INFORMATION_SCHEMA_CONSTRAINT = t.TypeOf<typeof INFORMATION_SCHEMA_CONSTRAINT_Type>

export const INFORMATION_SCHEMA_Type = t.type({
    db_name: t.string,
    tables: t.array(INFORMATION_SCHEMA_TABLE_Type),
    columns: t.array(INFORMATION_SCHEMA_COLUMN_Type),
    constraints: t.array(INFORMATION_SCHEMA_CONSTRAINT_Type)
})

export type INFORMATION_SCHEMA = t.TypeOf<typeof INFORMATION_SCHEMA_Type>

export interface IInformationSchemaReader {
    read: () => Promise<INFORMATION_SCHEMA | null>
};