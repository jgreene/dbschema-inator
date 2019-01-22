import { SqlServerInformationSchemaReader } from './index';
import { getDBSchema } from 'dbschema-inator';

import { runTests } from 'dbschema-inator/src/tests'

const config = {
    driver: 'msnodesqlv8',
    server: 'localhost',
    database: 'dbschema-inator',
    options: {
        trustedConnection: true
    }
};

test('mssql dbschema tests', async () => {
    const db = new SqlServerInformationSchemaReader(config);
    const schema = await getDBSchema(db);

    expect(schema).not.toBeNull()

    runTests('dbo', schema!);
})

