create database "dbschema-inator";

\c "dbschema-inator";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create table "public"."Person" (
	"ID" int not null generated always as identity primary key,
	"FirstName" VARCHAR(50) NOT NULL, 
	"LastName" VARCHAR(50) NOT NULL,
	"PersonGUID" uuid not null default(uuid_generate_v4()),
	"CreatedBy" VARCHAR(50) NULL,
	"ModifiedBy" VARCHAR(50) NULL,
	"CreatedOn" timestamp with time zone not null default (now() at time zone 'utc'),
	"ModifiedOn" timestamp with time zone not null default (now() at time zone 'utc')
);

alter table "public"."Person" add constraint "UC_PersonGUID" unique("PersonGUID");

create table "public"."PersonExtra" (
	"PersonID" INT NOT NULL PRIMARY KEY
		CONSTRAINT "FK_PersonExtra_PersonID" REFERENCES "public"."Person"("ID"),
	"ExtraPersonDescription" VARCHAR(100) NULL
);

create table "public"."PersonAddress" (
	"ID" int not null generated always as identity primary key,
	"PersonID" INT NOT NULL
		CONSTRAINT "FK_PersonAddress_PersonID" REFERENCES "public"."Person"("ID"),
	"StreetAddress1" VARCHAR(100) NOT NULL,
	"StreetAddress2" VARCHAR(100) NULL,
	"StreetAddress3" VARCHAR(100) NULL,
	"City" VARCHAR(50) NOT NULL,
	"StateProvince" VARCHAR(50) NOT NULL,
	"PostalCode" VARCHAR(20) NOT NULL,
	"CreatedBy" VARCHAR(50) NULL,
	"ModifiedBy" VARCHAR(50) NULL,
	"CreatedOn" timestamp with time zone not null default (now() at time zone 'utc'),
	"ModifiedOn" timestamp with time zone not null default (now() at time zone 'utc')
);


CREATE TABLE "public"."FunctionRole"(
	"ID" int not null generated always as identity primary key,
	"Name" varchar(100) NOT null unique,
	"Description" text NULL,
	"OldID" varchar(255) NOT null
);

CREATE TABLE "public"."CompanyPerson"(
	"PersonID" int NOT null references "public"."Person"("ID"),
	"Sequence" int NOT NULL,
	"CompanyID" int NOT NULL,
	"PrimaryFunctionID" int NOT null default(1) references "public"."FunctionRole"("ID"),
	primary key("PersonID", "Sequence")
);

CREATE TABLE "public"."CompanyPersonFunction"(
	"PersonID" int NOT null,
	"PerCoSequence" int NOT NULL,
	"Sequence" int NOT NULL,
	"FunctionID" int NOT NULL,
	primary key("PersonID", "PerCoSequence", "Sequence")
);

ALTER TABLE "public"."CompanyPersonFunction"  ADD  CONSTRAINT "FK_PersonCompanyFunctions808" FOREIGN KEY("PersonID", "PerCoSequence")
REFERENCES "public"."CompanyPerson" ("PersonID", "Sequence");

ALTER TABLE "public"."CompanyPersonFunction"  ADD  CONSTRAINT "fkey_CompanyPersonFunction1730_LINK_3" FOREIGN KEY("FunctionID")
REFERENCES "public"."FunctionRole" ("ID");

