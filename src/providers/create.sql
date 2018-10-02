create table dbo.Person (
	ID INT NOT NULL PRIMARY KEY IDENTITY(1,1), 
	FirstName NVARCHAR(50) NOT NULL, 
	LastName NVARCHAR(50) NOT NULL,
	PersonGUID uniqueidentifier not null default(newid()),
	[CreatedBy] NVARCHAR(50) NULL,
	[ModifiedBy] NVARCHAR(50) NULL,
	[CreatedOn] DATETIMEOFFSET NOT NULL DEFAULT(SYSDATETIMEOFFSET()),
	[ModifiedOn] DATETIMEOFFSET NOT NULL DEFAULT(SYSDATETIMEOFFSET())
)
GO

alter table dbo.Person add constraint UC_PersonGUID unique(PersonGUID);
GO

create table dbo.PersonExtra (
	PersonID INT NOT NULL PRIMARY KEY
		CONSTRAINT FK_PersonExtra_PersonID REFERENCES [dbo].[Person]([ID]),
	ExtraPersonDescription NVARCHAR(100) NULL
)
GO

create table dbo.PersonAddress (
	ID INT NOT NULL PRIMARY KEY IDENTITY(1,1), 
	PersonID INT NOT NULL
		CONSTRAINT FK_PersonAddress_PersonID REFERENCES [dbo].[Person]([ID]),
	StreetAddress1 NVARCHAR(100) NOT NULL,
	StreetAddress2 NVARCHAR(100) NULL,
	StreetAddress3 NVARCHAR(100) NULL,
	City NVARCHAR(50) NOT NULL,
	StateProvince NVARCHAR(50) NOT NULL,
	PostalCode NVARCHAR(20) NOT NULL,
	[CreatedBy] NVARCHAR(50) NULL,
	[ModifiedBy] NVARCHAR(50) NULL,
	[CreatedOn] DATETIMEOFFSET NOT NULL DEFAULT(SYSDATETIMEOFFSET()),
	[ModifiedOn] DATETIMEOFFSET NOT NULL DEFAULT(SYSDATETIMEOFFSET())
)
GO

CREATE TABLE [dbo].[FunctionRole](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nchar](100) NOT NULL,
	[Description] [nvarchar](4000) NULL,
	[OldID] [nchar](255) NOT NULL,
 CONSTRAINT [pkey_FunctionRole] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 80) ON [PRIMARY],
 CONSTRAINT [UQ_FunctionRole_Name] UNIQUE NONCLUSTERED 
(
	[Name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 80) ON [PRIMARY]
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[CompanyPerson](
	[PersonID] [int] NOT NULL,
	[Sequence] [int] NOT NULL,
	[CompanyID] [int] NOT NULL,
	[PrimaryFunctionID] [int] NOT NULL,
    CONSTRAINT [pkey_CompanyPerson] PRIMARY KEY CLUSTERED 
(
	[PersonID] ASC,
	[Sequence] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 80) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[CompanyPerson] ADD  DEFAULT (1) FOR [PrimaryFunctionID]
GO

ALTER TABLE [dbo].[CompanyPerson]  WITH CHECK ADD  CONSTRAINT [FK_PersonCompanies804] FOREIGN KEY([PersonID])
REFERENCES [dbo].[Person] ([ID])
GO

ALTER TABLE [dbo].[CompanyPerson] CHECK CONSTRAINT [FK_PersonCompanies804]
GO

CREATE TABLE [dbo].[CompanyPersonFunction](
	[PersonID] [int] NOT NULL,
	[PerCoSequence] [int] NOT NULL,
	[Sequence] [int] NOT NULL,
	[FunctionID] [int] NOT NULL,
 CONSTRAINT [pkey_CompanyPersonFunction] PRIMARY KEY CLUSTERED 
(
	[PersonID] ASC,
	[PerCoSequence] ASC,
	[Sequence] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, FILLFACTOR = 80) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[CompanyPersonFunction]  WITH CHECK ADD  CONSTRAINT [FK_PersonCompanyFunctions808] FOREIGN KEY([PersonID], [PerCoSequence])
REFERENCES [dbo].[CompanyPerson] ([PersonID], [Sequence])
GO

ALTER TABLE [dbo].[CompanyPersonFunction] CHECK CONSTRAINT [FK_PersonCompanyFunctions808]
GO

ALTER TABLE [dbo].[CompanyPersonFunction]  WITH CHECK ADD  CONSTRAINT [fkey_CompanyPersonFunction1730_LINK_3] FOREIGN KEY([FunctionID])
REFERENCES [dbo].[FunctionRole] ([ID])
GO

ALTER TABLE [dbo].[CompanyPersonFunction] CHECK CONSTRAINT [fkey_CompanyPersonFunction1730_LINK_3]
GO