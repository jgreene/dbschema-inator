import { PostgresqlInformationSchemaReader } from './index';
import { getDBSchema } from 'dbschema-inator';

import { runTests } from 'dbschema-inator/src/tests'

const config = {
    user: 'postgres',
    host: 'localhost',
    database: 'dbschema-inator',
    password: 'postgres',
    port: 5433,
};

test('postgresql dbschema tests', async () => {
    const db = new PostgresqlInformationSchemaReader(config);
    const schema = await getDBSchema(db);

    expect(schema).not.toBeNull()

    runTests('public', schema!);
})
