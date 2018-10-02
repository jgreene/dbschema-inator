import { expect } from 'chai';
import 'mocha';

import { FileInformationSchemaReader } from './filereader';
import { getDBSchema } from '../index';

describe('INFORMATION_SCHEMA', async () => {
    const reader = new FileInformationSchemaReader('./src/providers/test_schema.json');
    
    it('Can get INFORMATION_SCHEMA', async () => {
        const info_schema = await reader.read();

        expect(info_schema).is.not.null;
    });

    it('Can map to DBSchema', async () => {
        const info_schema = await reader.read();
        const db_schema = await getDBSchema(reader);

        expect(info_schema).is.not.null;
        expect(db_schema).is.not.null;

        if(db_schema === null || info_schema === null)
            throw new Error('null schema');

        expect(db_schema.name).eq(info_schema.tables[0].TABLE_CATALOG);

        expect(db_schema.tables.length).eq(info_schema.tables.length);

        info_schema.tables.forEach(tinfo => {
            const table = db_schema.tables.filter(t => t.name.db_name === tinfo.TABLE_CATALOG && t.name.schema === tinfo.TABLE_SCHEMA && t.name.name === tinfo.TABLE_NAME)[0];

            expect(table.name.name).eq(tinfo.TABLE_NAME);
            expect(table.name.db_name).eq(tinfo.TABLE_CATALOG);
            expect(table.name.schema).eq(tinfo.TABLE_SCHEMA);
            expect(table.type).eq(tinfo.TABLE_TYPE);

            const columns = info_schema.columns.filter(cinfo => cinfo.TABLE_CATALOG === table.name.db_name && cinfo.TABLE_SCHEMA === table.name.schema && cinfo.TABLE_NAME === table.name.name);

            expect(table.columns.length).eq(columns.length);

            columns.forEach(cinfo => {
                const column = table.columns.filter(c => c.name === cinfo.COLUMN_NAME)[0];

                expect(column.name).eq(cinfo.COLUMN_NAME);
                expect(column.max_length).eq(cinfo.CHARACTER_MAXIMUM_LENGTH);
                expect(column.is_nullable).eq(cinfo.IS_NULLABLE);
                expect(column.db_type).eq(cinfo.DATA_TYPE);
            });
        });
    });

    it('Person schema is correct', async () => {
        const db_schema = await getDBSchema(reader);

        if(db_schema === null)
            throw new Error('null schema');

        const at = db_schema.tables.filter(t => t.name.name === 'Person')[0];

        expect(at).is.not.null;

        expect(at.name.name).eq('Person');
        expect(at.name.db_name).eq('dbschema-inator');
        expect(at.name.schema).eq('dbo');
        expect(at.primary_keys.length).eq(1);
        expect(at.primary_keys[0]).eq('ID');
        expect(at.type).eq('BASE TABLE');
        expect(at.one_to_manys.length).eq(2);

        expect(at.columns.length).eq(8);

        const idColumn = at.columns.find(c => c.name === 'ID');
        expect(idColumn!.is_identity).eq(true);
        expect(idColumn!.is_only_primary_key).eq(true);
        expect(idColumn!.is_part_of_primary_key).eq(true);

        const firstNameColumn = at.columns.find(c => c.name === 'FirstName');
        expect(firstNameColumn!.is_identity).eq(false);
        expect(firstNameColumn!.is_only_primary_key).eq(false);
        expect(firstNameColumn!.is_part_of_primary_key).eq(false);
        expect(firstNameColumn!.db_type).eq('nvarchar');
        expect(firstNameColumn!.max_length).eq(50);

        const personGUID = at.columns.find(c => c.name === 'PersonGUID');
        expect(personGUID!.is_part_of_unique_constraint).eq(true);
        expect(personGUID!.is_only_member_of_unique_constraint).eq(true);

        const fk_PersonAddress_PersonID = at.one_to_manys.filter(mto => mto.constraint_name.name === 'FK_PersonAddress_PersonID')[0]
        expect(fk_PersonAddress_PersonID!.child_table.name).eq('PersonAddress');
        expect(fk_PersonAddress_PersonID!.column_map.length).eq(1);

        const personIdToID = fk_PersonAddress_PersonID.column_map.find(c => c.column === 'ID' && c.child_column === 'PersonID');
        expect(personIdToID!.column).eq('ID');
        expect(personIdToID!.child_column).eq('PersonID');

        const fk_PersonExtra_PersonID_OneToManyCheck = at.one_to_manys.find(mto => mto.constraint_name.name === 'FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID_OneToManyCheck).eq(undefined);

        const fk_PersonExtra_PersonID_ManyToOneCheck = at.many_to_ones.find(mto => mto.constraint_name.name === 'FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID_ManyToOneCheck).eq(undefined);

        const fk_PersonExtra_PersonID = at.one_to_ones.find(mto => mto.constraint_name.name === 'FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID!.constraint_name.name).eq('FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID!.sibling_table.name).eq('PersonExtra');
        expect(fk_PersonExtra_PersonID!.column_map.length).eq(1);
        expect(fk_PersonExtra_PersonID!.column_map[0].column).eq('ID');
        expect(fk_PersonExtra_PersonID!.column_map[0].sibling_column).eq('PersonID');
    });

    it('PersonExtra schema is correct', async () => {
        const db_schema = await getDBSchema(reader);

        if(db_schema === null)
            throw new Error('null schema');

        const at = db_schema.tables.filter(t => t.name.name === 'PersonExtra')[0];

        expect(at).is.not.null;

        expect(at.name.name).eq('PersonExtra');
        expect(at.name.db_name).eq('dbschema-inator');
        expect(at.name.schema).eq('dbo');
        expect(at.primary_keys.length).eq(1);
        expect(at.primary_keys[0]).eq('PersonID');
        expect(at.type).eq('BASE TABLE');
        expect(at.one_to_ones.length).eq(1);
        expect(at.one_to_manys.length).eq(0);
        expect(at.many_to_ones.length).eq(0);

        expect(at.columns.length).eq(2);

        const idColumn = at.columns.find(c => c.name === 'PersonID');
        expect(idColumn!.is_identity).eq(false);
        expect(idColumn!.is_only_primary_key).eq(true);
        expect(idColumn!.is_part_of_primary_key).eq(true);

        const fk_PersonExtra_PersonID = at.one_to_ones.find(mto => mto.constraint_name.name === 'FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID!.constraint_name.name).eq('FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID!.sibling_table.name).eq('Person');
        expect(fk_PersonExtra_PersonID!.column_map.length).eq(1);
        expect(fk_PersonExtra_PersonID!.column_map[0].column).eq('PersonID');
        expect(fk_PersonExtra_PersonID!.column_map[0].sibling_column).eq('ID');
    });

    it('PersonAddress schema is correct', async () => {
        const db_schema = await getDBSchema(reader);

        if(db_schema === null)
            throw new Error('null schema');

        const at = db_schema.tables.filter(t => t.name.name === 'PersonAddress')[0];

        expect(at).is.not.null;

        expect(at.name.name).eq('PersonAddress');
        expect(at.name.db_name).eq('dbschema-inator');
        expect(at.name.schema).eq('dbo');
        expect(at.primary_keys.length).eq(1);
        expect(at.primary_keys[0]).eq('ID');
        expect(at.type).eq('BASE TABLE');

        expect(at.many_to_ones.length).eq(1);

        const fk_person = at.many_to_ones[0];
        expect(fk_person.parent_table.name).eq('Person');
        expect(fk_person.column_map.length).eq(1);
        const fk_person_key = fk_person.column_map[0];
        expect(fk_person_key.column).eq('PersonID');
        expect(fk_person_key.parent_column).eq('ID');
    });

    it('CompanyPersonFunction schema is correct', async () => {
        const db_schema = await getDBSchema(reader);

        if(db_schema === null)
            throw new Error('null schema');

        const at = db_schema.tables.filter(t => t.name.name === 'CompanyPersonFunction')[0];

        expect(at).is.not.null;

        expect(at.name.name).eq('CompanyPersonFunction');
        expect(at.name.db_name).eq('dbschema-inator');
        expect(at.name.schema).eq('dbo');
        expect(at.primary_keys.length).eq(3);
        expect(at.primary_keys).contains('PersonID');
        expect(at.primary_keys).contains('PerCoSequence');
        expect(at.primary_keys).contains('Sequence');
        expect(at.type).eq('BASE TABLE');

        expect(at.many_to_ones.length).eq(2);

        const fk_PersonCompanyFunctions808 = at.many_to_ones.filter(mto => mto.constraint_name.name === 'FK_PersonCompanyFunctions808')[0]

        expect(fk_PersonCompanyFunctions808.parent_table.name).eq('CompanyPerson');
        expect(fk_PersonCompanyFunctions808.column_map.length).eq(2);
        const personToPerson = fk_PersonCompanyFunctions808.column_map.find(c => c.column === 'PersonID' && c.parent_column === 'PersonID')
        expect(personToPerson!.column).eq('PersonID');
        expect(personToPerson!.parent_column).eq('PersonID');

        const sequenceToSequence = fk_PersonCompanyFunctions808.column_map.find(c => c.column === 'PerCoSequence' && c.parent_column === 'Sequence')
        expect(sequenceToSequence!.column).eq('PerCoSequence');
        expect(sequenceToSequence!.parent_column).eq('Sequence');
    });
});