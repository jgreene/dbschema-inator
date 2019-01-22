import { DBSchema } from './index';


export function runTests(default_schema: string, db_schema: DBSchema) {
    if(db_schema === null)
        throw new Error('null schema');

    const at = db_schema.tables.filter(t => t.name.name === 'Person')[0];

    expect(at).not.toBeNull();

    expect(at.name.name).toEqual('Person');
    expect(at.name.db_name).toEqual('dbschema-inator');
    expect(at.name.schema).toEqual(default_schema);
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

    const stringTypes = ['nvarchar', 'varchar', 'text', 'character varying'];
    expect(stringTypes).toContain(firstNameColumn!.db_type)
    expect(firstNameColumn!.max_length).toEqual(50);
    expect(firstNameColumn!.db_default).toBeNull();

    const personGUID = at.columns.find(c => c.name === 'PersonGUID');
    // expect(personGUID!.is_part_of_unique_constraint).toEqual(true);
    // expect(personGUID!.is_only_member_of_unique_constraint).toEqual(true);
    const newidTypeDefaults = ['(newid())', 'uuid_generate_v4()']
    expect(newidTypeDefaults).toContain(personGUID!.db_default)

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
}