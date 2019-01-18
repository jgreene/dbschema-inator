import "mocha";
import "chai";

import * as fs from 'fs';

import { SqlServerInformationSchemaReader } from './index';
import { getDBSchema } from 'dbschema-inator';

const config = {
    driver: 'msnodesqlv8',
    server: 'localhost',
    database: 'dbschema-inator',
    options: {
        trustedConnection: true
    }
};

async function time<T>(name: string, func: () => Promise<T>): Promise<T> {
    const start = new Date();
    const res = await func();
    const end = new Date();
    const diff = +end - +start;
    console.log(name + ' took ' + diff);
    return res;
};

describe('INFORMATION_SCHEMA', async () => {
    
    it('Can get INFORMATION_SCHEMA', async () => {
        const db = new SqlServerInformationSchemaReader(config);
        const schema = await db.read();

        fs.writeFile('./src/providers/test_schema.json', JSON.stringify(schema, null, 2), 'utf8', (err) => {
            console.log(err);
        });
        //console.log(schema);
    });

    it('Can get DBSchema', async () => {
        const db = new SqlServerInformationSchemaReader(config);
        const schema = await getDBSchema(db);
        console.log(JSON.stringify(schema, null, 2));
    });
})

