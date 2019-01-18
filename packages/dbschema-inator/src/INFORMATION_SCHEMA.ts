export type TABLE_TYPE = 'BASE TABLE' | 'VIEW'

export type INFORMATION_SCHEMA_TABLE = {
    TABLE_CATALOG: string;
    TABLE_SCHEMA: string;
    TABLE_NAME: string;
    TABLE_TYPE: TABLE_TYPE;
};

export type INFORMATION_SCHEMA_COLUMN = {
    TABLE_CATALOG: string;
    TABLE_SCHEMA: string;
    TABLE_NAME: string;
    TABLE_TYPE: string;
    COLUMN_NAME: string;
    COLUMN_DEFAULT: string | null;
    ORDINAL_POSITION: number;
    IS_NULLABLE: string;
    DATA_TYPE: string;
    CHARACTER_MAXIMUM_LENGTH: number | null;
    CHARACTER_OCTET_LENGTH: number | null;
    NUMERIC_PRECISION: number | null;
    NUMERIC_PRECISION_RADIX: number | null;
    NUMERIC_SCALE: number | null;
    IS_IDENTITY: boolean;
};

export type CONSTRAINT_TYPE = 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE';

export type INFORMATION_SCHEMA_CONSTRAINT = {
    CONSTRAINT_CATALOG: string;
    CONSTRAINT_SCHEMA: string;
    CONSTRAINT_NAME: string;
    CONSTRAINT_TYPE: CONSTRAINT_TYPE;
    TABLE_CATALOG: string;
    TABLE_SCHEMA: string;
    TABLE_NAME: string;
    COLUMN_NAME: string;
    ORDINAL_POSITION: number;
    UNIQUE_CONSTRAINT_CATALOG: string | null;
    UNIQUE_CONSTRAINT_SCHEMA: string | null;
    UNIQUE_CONSTRAINT_NAME: string | null;
    FK_TABLE_CATALOG: string | null;
    FK_TABLE_SCHEMA: string | null;
    FK_TABLE_NAME: string | null;
    FK_COLUMN_NAME: string | null;
    DELETE_RULE: string | null;
    UPDATE_RULE: string | null;
};

export type INFORMATION_SCHEMA = {
    db_name: string;
    tables: INFORMATION_SCHEMA_TABLE[];
    columns: INFORMATION_SCHEMA_COLUMN[];
    constraints: INFORMATION_SCHEMA_CONSTRAINT[];
};

export interface IInformationSchemaReader {
    read: () => Promise<INFORMATION_SCHEMA | null>
};