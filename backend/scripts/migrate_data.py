import os
from sqlalchemy import create_engine, MetaData, Table

old_url = os.environ["OLD_DATABASE_URL"]
new_url = os.environ["NEW_DATABASE_URL"]

def migrate():
    print("Connecting to databases...")
    old_engine = create_engine(old_url)
    new_engine = create_engine(new_url)

    old_meta = MetaData()
    print("Reflecting old database...")
    old_meta.reflect(bind=old_engine)
    
    new_meta = MetaData()
    print("Reflecting new database...")
    new_meta.reflect(bind=new_engine)
    
    # First, let's drop the conflicting dummy data tables we just created in new DB
    print("Dropping dummy tables from new DB...")
    new_meta.drop_all(bind=new_engine)
    new_meta.clear()

    # Now we copy the old tables over, except for Django/Auth junk
    ignore_prefixes = ("django_", "auth_", "user_usermodel_groups", "user_usermodel_user_permissions")
    
    # Sort tables by foreign key dependencies
    tables_to_create = []
    for table_name in old_meta.sorted_tables:
        if table_name.name.startswith(ignore_prefixes):
            print(f"Ignoring {table_name.name}")
            continue
        tables_to_create.append(table_name)

    print("Creating tables in new database...")
    for table in tables_to_create:
        # Strip out foreign keys to ignored tables
        foreign_keys_to_remove = []
        for fk in table.foreign_keys:
            if fk.column.table.name.startswith(ignore_prefixes):
                foreign_keys_to_remove.append(fk)
        
        for fk in foreign_keys_to_remove:
            table.foreign_keys.remove(fk)
            if fk.constraint in table.constraints:
                table.constraints.remove(fk.constraint)
                
        table.tometadata(new_meta)
            
    new_meta.create_all(bind=new_engine)
    
    print("Copying data...")
    with old_engine.connect() as old_conn, new_engine.begin() as new_conn:
        for table in tables_to_create:
            print(f"Migrating {table.name}...")
            result = old_conn.execute(table.select())
            # Fetch all rows as dictionaries
            rows = [dict(row._mapping) for row in result]
            if rows:
                new_table = new_meta.tables[table.name]
                new_conn.execute(new_table.insert(), rows)
                
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
