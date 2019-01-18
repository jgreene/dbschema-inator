
import { IInformationSchemaReader, INFORMATION_SCHEMA_TABLE, INFORMATION_SCHEMA_COLUMN, INFORMATION_SCHEMA_CONSTRAINT, INFORMATION_SCHEMA } from '../INFORMATION_SCHEMA';

import * as fs from 'fs';
import * as util from 'util';

const readFile = util.promisify(fs.readFile);


export class FileInformationSchemaReader implements IInformationSchemaReader {
    schema: INFORMATION_SCHEMA | undefined;
    constructor(public path: string) {}

    public async read() {
        if(this.schema === undefined){
            const contents = await readFile(this.path, 'utf-8');
            this.schema = JSON.parse(contents);
        }

        return this.schema === undefined ? null : this.schema;
    }
}