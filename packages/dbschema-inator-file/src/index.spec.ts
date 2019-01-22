import { getDBSchema } from 'dbschema-inator';
import { FileInformationSchemaReader } from './index';

describe('INFORMATION_SCHEMA', async () => {
    const reader = new FileInformationSchemaReader('./src/test_schema.json');
    
    it('Can get INFORMATION_SCHEMA', async () => {
        const info_schema = await reader.read();

        expect(info_schema).not.toBeNull();
    });

    it('Can map to DBSchema', async () => {
        const info_schema = await reader.read();
        const db_schema = await getDBSchema(reader);

        expect(info_schema).not.toBeNull();
        expect(db_schema).not.toBeNull();

        if(db_schema === null || info_schema === null)
            throw new Error('null schema');

        expect(db_schema.name).toEqual(info_schema.tables[0].TABLE_CATALOG);

        expect(db_schema.tables.length).toEqual(info_schema.tables.length);

        info_schema.tables.forEach(tinfo => {
            const table = db_schema.tables.filter(t => t.name.db_name === tinfo.TABLE_CATALOG && t.name.schema === tinfo.TABLE_SCHEMA && t.name.name === tinfo.TABLE_NAME)[0];

            expect(table.name.name).toEqual(tinfo.TABLE_NAME);
            expect(table.name.db_name).toEqual(tinfo.TABLE_CATALOG);
            expect(table.name.schema).toEqual(tinfo.TABLE_SCHEMA);
            expect(table.type).toEqual(tinfo.TABLE_TYPE);

            const columns = info_schema.columns.filter(cinfo => cinfo.TABLE_CATALOG === table.name.db_name && cinfo.TABLE_SCHEMA === table.name.schema && cinfo.TABLE_NAME === table.name.name);

            expect(table.columns.length).toEqual(columns.length);

            columns.forEach(cinfo => {
                const column = table.columns.filter(c => c.name === cinfo.COLUMN_NAME)[0];

                expect(column.name).toEqual(cinfo.COLUMN_NAME);
                expect(column.max_length).toEqual(cinfo.CHARACTER_MAXIMUM_LENGTH);
                expect(column.is_nullable).toEqual(cinfo.IS_NULLABLE === 'YES');
                expect(column.db_type).toEqual(cinfo.DATA_TYPE);
            });
        });
    });

    it('Person schema is correct', async () => {
        const db_schema = await getDBSchema(reader);

        if(db_schema === null)
            throw new Error('null schema');

        const at = db_schema.tables.filter(t => t.name.name === 'Person')[0];

        expect(at).not.toBeNull();

        expect(at.name.name).toEqual('Person');
        expect(at.name.db_name).toEqual('dbschema-inator');
        expect(at.name.schema).toEqual('dbo');
        expect(at.primary_keys.length).toEqual(1);
        expect(at.primary_keys[0]).toEqual('ID');
        expect(at.type).toEqual('BASE TABLE');
        expect(at.one_to_manys.length).toEqual(2);

        expect(at.columns.length).toEqual(8);

        const idColumn = at.columns.find(c => c.name === 'ID');
        expect(idColumn!.is_identity).toEqual(true);
        // expect(idColumn!.is_only_primary_key).toEqual(true);
        // expect(idColumn!.is_part_of_primary_key).toEqual(true);

        const firstNameColumn = at.columns.find(c => c.name === 'FirstName');
        expect(firstNameColumn!.is_identity).toEqual(false);
        // expect(firstNameColumn!.is_only_primary_key).toEqual(false);
        // expect(firstNameColumn!.is_part_of_primary_key).toEqual(false);
        expect(firstNameColumn!.db_type).toEqual('nvarchar');
        expect(firstNameColumn!.max_length).toEqual(50);
        expect(firstNameColumn!.db_default).toBeNull()

        const personGUID = at.columns.find(c => c.name === 'PersonGUID');
        // expect(personGUID!.is_part_of_unique_constraint).toEqual(true);
        // expect(personGUID!.is_only_member_of_unique_constraint).toEqual(true);
        expect(personGUID!.db_default).toEqual('(newid())')

        const fk_PersonAddress_PersonID = at.one_to_manys.filter(mto => mto.constraint_name.name === 'FK_PersonAddress_PersonID')[0]
        expect(fk_PersonAddress_PersonID!.child_table.name).toEqual('PersonAddress');
        expect(fk_PersonAddress_PersonID!.column_map.length).toEqual(1);

        const personIdToID = fk_PersonAddress_PersonID.column_map.find(c => c.column === 'ID' && c.child_column === 'PersonID');
        expect(personIdToID!.column).toEqual('ID');
        expect(personIdToID!.child_column).toEqual('PersonID');

        const fk_PersonExtra_PersonID_OneToManyCheck = at.one_to_manys.find(mto => mto.constraint_name.name === 'FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID_OneToManyCheck).toEqual(undefined);

        const fk_PersonExtra_PersonID_ManyToOneCheck = at.many_to_ones.find(mto => mto.constraint_name.name === 'FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID_ManyToOneCheck).toEqual(undefined);

        const fk_PersonExtra_PersonID = at.one_to_ones.find(mto => mto.constraint_name.name === 'FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID!.constraint_name.name).toEqual('FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID!.sibling_table.name).toEqual('PersonExtra');
        expect(fk_PersonExtra_PersonID!.column_map.length).toEqual(1);
        expect(fk_PersonExtra_PersonID!.column_map[0].column).toEqual('ID');
        expect(fk_PersonExtra_PersonID!.column_map[0].sibling_column).toEqual('PersonID');
    });

    it('PersonExtra schema is correct', async () => {
        const db_schema = await getDBSchema(reader);

        if(db_schema === null)
            throw new Error('null schema');

        const at = db_schema.tables.filter(t => t.name.name === 'PersonExtra')[0];

        expect(at).not.toBeNull();

        expect(at.name.name).toEqual('PersonExtra');
        expect(at.name.db_name).toEqual('dbschema-inator');
        expect(at.name.schema).toEqual('dbo');
        expect(at.primary_keys.length).toEqual(1);
        expect(at.primary_keys[0]).toEqual('PersonID');
        expect(at.type).toEqual('BASE TABLE');
        expect(at.one_to_ones.length).toEqual(1);
        expect(at.one_to_manys.length).toEqual(0);
        expect(at.many_to_ones.length).toEqual(0);

        expect(at.columns.length).toEqual(2);

        const idColumn = at.columns.find(c => c.name === 'PersonID');
        expect(idColumn!.is_identity).toEqual(false);
        // expect(idColumn!.is_only_primary_key).toEqual(true);
        // expect(idColumn!.is_part_of_primary_key).toEqual(true);

        const fk_PersonExtra_PersonID = at.one_to_ones.find(mto => mto.constraint_name.name === 'FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID!.constraint_name.name).toEqual('FK_PersonExtra_PersonID');
        expect(fk_PersonExtra_PersonID!.sibling_table.name).toEqual('Person');
        expect(fk_PersonExtra_PersonID!.column_map.length).toEqual(1);
        expect(fk_PersonExtra_PersonID!.column_map[0].column).toEqual('PersonID');
        expect(fk_PersonExtra_PersonID!.column_map[0].sibling_column).toEqual('ID');
    });

    it('PersonAddress schema is correct', async () => {
        const db_schema = await getDBSchema(reader);

        if(db_schema === null)
            throw new Error('null schema');

        const at = db_schema.tables.filter(t => t.name.name === 'PersonAddress')[0];

        expect(at).not.toBeNull();

        expect(at.name.name).toEqual('PersonAddress');
        expect(at.name.db_name).toEqual('dbschema-inator');
        expect(at.name.schema).toEqual('dbo');
        expect(at.primary_keys.length).toEqual(1);
        expect(at.primary_keys[0]).toEqual('ID');
        expect(at.type).toEqual('BASE TABLE');

        expect(at.many_to_ones.length).toEqual(1);

        const fk_person = at.many_to_ones[0];
        expect(fk_person.parent_table.name).toEqual('Person');
        expect(fk_person.column_map.length).toEqual(1);
        const fk_person_key = fk_person.column_map[0];
        expect(fk_person_key.column).toEqual('PersonID');
        expect(fk_person_key.parent_column).toEqual('ID');
    });

    it('CompanyPersonFunction schema is correct', async () => {
        const db_schema = await getDBSchema(reader);

        if(db_schema === null)
            throw new Error('null schema');

        const at = db_schema.tables.filter(t => t.name.name === 'CompanyPersonFunction')[0];

        expect(at).not.toBeNull();

        expect(at.name.name).toEqual('CompanyPersonFunction');
        expect(at.name.db_name).toEqual('dbschema-inator');
        expect(at.name.schema).toEqual('dbo');
        expect(at.primary_keys.length).toEqual(3);
        expect(at.primary_keys).toContain('PersonID');
        expect(at.primary_keys).toContain('PerCoSequence');
        expect(at.primary_keys).toContain('Sequence');
        expect(at.type).toEqual('BASE TABLE');

        expect(at.many_to_ones.length).toEqual(2);

        const fk_PersonCompanyFunctions808 = at.many_to_ones.filter(mto => mto.constraint_name.name === 'FK_PersonCompanyFunctions808')[0]

        expect(fk_PersonCompanyFunctions808.parent_table.name).toEqual('CompanyPerson');
        expect(fk_PersonCompanyFunctions808.column_map.length).toEqual(2);
        const personToPerson = fk_PersonCompanyFunctions808.column_map.find(c => c.column === 'PersonID' && c.parent_column === 'PersonID')
        expect(personToPerson!.column).toEqual('PersonID');
        expect(personToPerson!.parent_column).toEqual('PersonID');

        const sequenceToSequence = fk_PersonCompanyFunctions808.column_map.find(c => c.column === 'PerCoSequence' && c.parent_column === 'Sequence')
        expect(sequenceToSequence!.column).toEqual('PerCoSequence');
        expect(sequenceToSequence!.parent_column).toEqual('Sequence');
    });
});