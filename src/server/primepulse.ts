import { formatDate, normalizeSendAt } from "#/lib/dates";
import { readinessReport } from "#/lib/pulse";
import {
	applySendSkips,
	type SendSkipRef,
	todayIso,
	upcomingSends,
} from "#/lib/schedule";
import type {
	AnniversarySource,
	EmailTemplate,
	EmployeeRow,
	MilestoneType,
	TemplateKind,
	UpcomingBoard,
} from "#/lib/types";
import { DEFAULT_ANNIVERSARY_YEARS } from "#/lib/types";
import { sql, sqlPool } from "#/server/azureSql";
import type { SaveTemplateInput } from "#/server/schemas";

const REQUIRED_COLUMNS = [
	"associateOID",
	"workAssignments_0_assignmentStatus_statusCode_codeValue",
	"workerDates_originalHireDate",
	"workAssignments_0_seniorityDate",
	"person_birthDate",
];
const FORMATTED_NAME_COLUMNS = [
	"person_legalName_formattedName",
	"person_preferredName_formattedName",
];
const GIVEN_NAME_COLUMNS = [
	"person_legalName_givenName",
	"person_preferredName_givenName",
];
const FAMILY_NAME_COLUMNS = [
	"person_legalName_familyName1",
	"person_legalName_familyName",
];
const WORK_EMAIL_COLUMNS = ["businessCommunication_emails_0_emailUri"];
const PERSONAL_EMAIL_COLUMNS = ["person_communication_emails_0_emailUri"];
const MANAGER_OID_COLUMNS = ["workAssignments_0_reportsTo_0_associateOID"];
const MANAGER_NAME_COLUMNS = [
	"workAssignments_0_reportsTo_0_reportsToWorkerName_formattedName",
];

const ACTIVE = `LTRIM(RTRIM(CONVERT(nvarchar(40), e.[workAssignments_0_assignmentStatus_statusCode_codeValue]))) = N'A'`;
const OID = `CONVERT(nvarchar(128), e.[associateOID])`;

let ready: Promise<void> | null = null;
let columnNames: Map<string, string> | null = null;

function quote(name: string) {
	if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
		throw new Error(`Unexpected column ${name}`);
	}
	return `[${name}]`;
}

function column(columns: Map<string, string>, name: string) {
	const actual = columns.get(name.toLowerCase());
	if (!actual) throw new Error(`adp.Employee is missing ${name}`);
	return quote(actual);
}

function firstPresent(columns: Map<string, string>, names: string[]) {
	return names.find((name) => columns.has(name.toLowerCase()));
}

function optionalSql(
	columns: Map<string, string>,
	names: string[],
	asAlias: string,
) {
	const found = firstPresent(columns, names);
	if (!found) return `CAST(NULL AS nvarchar(400)) AS ${asAlias}`;
	return `MAX(NULLIF(LTRIM(RTRIM(CONVERT(nvarchar(400), e.${column(columns, found)}))), N'')) AS ${asAlias}`;
}

function displayNameSql(columns: Map<string, string>) {
	const formatted = firstPresent(columns, FORMATTED_NAME_COLUMNS);
	if (formatted) {
		return `NULLIF(LTRIM(RTRIM(e.${column(columns, formatted)})), N'')`;
	}
	const given = firstPresent(columns, GIVEN_NAME_COLUMNS);
	const family = firstPresent(columns, FAMILY_NAME_COLUMNS);
	if (given && family) {
		return `NULLIF(LTRIM(RTRIM(CONCAT(e.${column(columns, given)}, N' ', e.${column(columns, family)}))), N'')`;
	}
	if (given) return `NULLIF(LTRIM(RTRIM(e.${column(columns, given)})), N'')`;
	return `CAST(NULL AS nvarchar(400))`;
}

async function ensurePrimepulse(pool: {
	request: () => { query: (statement: string) => Promise<unknown> };
}) {
	if (!ready) {
		ready = createTables(pool).catch((error) => {
			ready = null;
			throw error;
		});
	}
	await ready;
}

async function createTables(pool: {
	request: () => { query: (statement: string) => Promise<unknown> };
}) {
	const batches = [
		`IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'primepulse') EXEC(N'CREATE SCHEMA primepulse');`,
		`IF OBJECT_ID(N'primepulse.EmailTemplate', N'U') IS NULL
CREATE TABLE [primepulse].[EmailTemplate] (
	id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_primepulse_EmailTemplate PRIMARY KEY,
	[name] nvarchar(200) NOT NULL,
	[type] nvarchar(32) NOT NULL CONSTRAINT DF_primepulse_EmailTemplate_type DEFAULT N'employee_day_of',
	kind nvarchar(32) NOT NULL,
	milestoneTypes nvarchar(max) NOT NULL,
	daysBeforeMonthStart int NOT NULL CONSTRAINT DF_primepulse_EmailTemplate_lead DEFAULT (14),
	anniversaryYears nvarchar(max) NOT NULL CONSTRAINT DF_primepulse_EmailTemplate_years DEFAULT N'[]',
	recipientEmails nvarchar(max) NOT NULL CONSTRAINT DF_primepulse_EmailTemplate_to DEFAULT N'[]',
	sendAt nvarchar(5) NOT NULL CONSTRAINT DF_primepulse_EmailTemplate_sendAt DEFAULT N'09:00',
	emailSubject nvarchar(400) NOT NULL,
	emailBody nvarchar(max) NOT NULL,
	enabled bit NOT NULL CONSTRAINT DF_primepulse_EmailTemplate_on DEFAULT (1),
	createdAt datetime2 NOT NULL CONSTRAINT DF_primepulse_EmailTemplate_created DEFAULT SYSUTCDATETIME(),
	updatedAt datetime2 NOT NULL CONSTRAINT DF_primepulse_EmailTemplate_updated DEFAULT SYSUTCDATETIME(),
	CONSTRAINT CK_primepulse_EmailTemplate_kind CHECK (kind IN (N'employee_day_of', N'manager_monthly', N'ceo_anniversary', N'ceo_monthly')),
	CONSTRAINT UQ_primepulse_EmailTemplate_name UNIQUE ([name])
);`,
		`IF COL_LENGTH(N'primepulse.EmailTemplate', N'kind') IS NULL ALTER TABLE [primepulse].[EmailTemplate] ADD kind nvarchar(32) NULL;`,
		`IF COL_LENGTH(N'primepulse.EmailTemplate', N'milestoneTypes') IS NULL ALTER TABLE [primepulse].[EmailTemplate] ADD milestoneTypes nvarchar(max) NULL;`,
		`IF COL_LENGTH(N'primepulse.EmailTemplate', N'daysBeforeMonthStart') IS NULL ALTER TABLE [primepulse].[EmailTemplate] ADD daysBeforeMonthStart int NULL;`,
		`IF COL_LENGTH(N'primepulse.EmailTemplate', N'anniversaryYears') IS NULL ALTER TABLE [primepulse].[EmailTemplate] ADD anniversaryYears nvarchar(max) NULL;`,
		`IF COL_LENGTH(N'primepulse.EmailTemplate', N'recipientEmails') IS NULL ALTER TABLE [primepulse].[EmailTemplate] ADD recipientEmails nvarchar(max) NULL;`,
		`IF COL_LENGTH(N'primepulse.EmailTemplate', N'enabled') IS NULL ALTER TABLE [primepulse].[EmailTemplate] ADD enabled bit NULL;`,
		`IF COL_LENGTH(N'primepulse.EmailTemplate', N'sendAt') IS NULL ALTER TABLE [primepulse].[EmailTemplate] ADD sendAt nvarchar(5) NULL;`,
		`UPDATE [primepulse].[EmailTemplate] SET sendAt = N'09:00' WHERE sendAt IS NULL;`,
		`UPDATE [primepulse].[EmailTemplate]
SET kind = CASE [type]
		WHEN N'birthday' THEN N'employee_day_of'
		WHEN N'anniversary' THEN N'employee_day_of'
		WHEN N'manager_monthly' THEN N'manager_monthly'
		WHEN N'ceo_anniversary' THEN N'ceo_anniversary'
		WHEN N'ceo_monthly' THEN N'ceo_monthly'
		WHEN N'employee_day_of' THEN N'employee_day_of'
		ELSE N'manager_monthly'
	END
WHERE kind IS NULL;`,
		`UPDATE [primepulse].[EmailTemplate]
SET milestoneTypes = CASE [type]
		WHEN N'birthday' THEN N'["birthday"]'
		WHEN N'ceo_anniversary' THEN N'["anniversary"]'
		WHEN N'anniversary' THEN N'["anniversary"]'
		ELSE N'["anniversary","birthday"]'
	END
WHERE milestoneTypes IS NULL;`,
		`UPDATE [primepulse].[EmailTemplate] SET daysBeforeMonthStart = 14 WHERE daysBeforeMonthStart IS NULL;`,
		`UPDATE [primepulse].[EmailTemplate] SET anniversaryYears = N'[1,5,10,15,20,25,30]' WHERE anniversaryYears IS NULL AND kind = N'ceo_anniversary';`,
		`UPDATE [primepulse].[EmailTemplate] SET anniversaryYears = N'[]' WHERE anniversaryYears IS NULL;`,
		`UPDATE [primepulse].[EmailTemplate] SET recipientEmails = N'[]' WHERE recipientEmails IS NULL;`,
		`UPDATE [primepulse].[EmailTemplate] SET enabled = 1 WHERE enabled IS NULL;`,
		`IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_primepulse_EmailTemplate_type')
ALTER TABLE [primepulse].[EmailTemplate] DROP CONSTRAINT CK_primepulse_EmailTemplate_type;`,
		`IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_primepulse_EmailTemplate_kind')
ALTER TABLE [primepulse].[EmailTemplate] DROP CONSTRAINT CK_primepulse_EmailTemplate_kind;`,
		`ALTER TABLE [primepulse].[EmailTemplate] ALTER COLUMN kind nvarchar(32) NOT NULL;`,
		`ALTER TABLE [primepulse].[EmailTemplate] WITH NOCHECK ADD CONSTRAINT CK_primepulse_EmailTemplate_kind CHECK (kind IN (N'employee_day_of', N'manager_monthly', N'ceo_anniversary', N'ceo_monthly'));`,
		`IF OBJECT_ID(N'primepulse.SendSkip', N'U') IS NULL
CREATE TABLE [primepulse].[SendSkip] (
	templateId int NOT NULL,
	associateOID nvarchar(128) NOT NULL,
	milestoneType nvarchar(32) NOT NULL,
	milestoneDate nvarchar(10) NOT NULL,
	createdAt datetime2 NOT NULL CONSTRAINT DF_primepulse_SendSkip_created DEFAULT SYSUTCDATETIME(),
	CONSTRAINT PK_primepulse_SendSkip PRIMARY KEY (templateId, associateOID, milestoneType, milestoneDate),
	CONSTRAINT CK_primepulse_SendSkip_type CHECK (milestoneType IN (N'birthday', N'anniversary'))
);`,
	];
	try {
		for (const batch of batches) {
			await pool.request().query(batch);
		}
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown SQL error";
		throw new Error(
			`Could not prepare the primepulse schema. The signed-in Azure identity needs permission to change primepulse in atg-requirements. ${message}`,
		);
	}
}

async function employeeColumns(pool: {
	request: () => {
		query: (
			statement: string,
		) => Promise<{ recordset?: Array<Record<string, unknown>> }>;
	};
}) {
	if (columnNames) return columnNames;
	const result = await pool.request().query(`
		SELECT COLUMN_NAME
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = N'adp' AND TABLE_NAME = N'Employee'
	`);
	const names = new Map<string, string>();
	for (const row of result.recordset ?? []) {
		const name = String(row.COLUMN_NAME ?? "");
		if (name) names.set(name.toLowerCase(), name);
	}
	if (!names.size) {
		throw new Error("adp.Employee was not found in atg-requirements");
	}
	const missing = REQUIRED_COLUMNS.filter(
		(name) => !names.has(name.toLowerCase()),
	);
	if (missing.length) {
		throw new Error(`adp.Employee is missing ${missing.join(", ")}`);
	}
	columnNames = names;
	return names;
}

function storedDateSql(columnSql: string) {
	const text = `LTRIM(RTRIM(CONVERT(nvarchar(40), ${columnSql})))`;
	return `CASE
		WHEN NULLIF(${text}, N'') LIKE N'0000-%' THEN LEFT(${text}, 10)
		ELSE CONVERT(varchar(10), TRY_CONVERT(date, ${columnSql}), 23)
	END`;
}

function dateOrNull(value: unknown) {
	if (value == null) return null;
	const text = String(value).trim();
	return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null;
}

function timestamp(value: unknown) {
	if (value instanceof Date) return value.toISOString();
	return String(value ?? "");
}

function readJsonArray(value: unknown) {
	if (Array.isArray(value)) return value;
	const text = String(value ?? "").trim();
	if (!text) return [];
	try {
		const parsed = JSON.parse(text) as unknown;
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function asEmails(value: unknown) {
	return readJsonArray(value)
		.map((item) => String(item).trim())
		.filter(Boolean);
}

function asMilestoneTypes(value: unknown): MilestoneType[] {
	const allowed: MilestoneType[] = ["anniversary", "birthday"];
	const types = readJsonArray(value)
		.map((item) => String(item))
		.filter((item): item is MilestoneType =>
			allowed.includes(item as MilestoneType),
		);
	return types.length ? [...new Set(types)] : ["anniversary"];
}

function asYears(value: unknown) {
	const years = readJsonArray(value)
		.map((item) => Number(item))
		.filter((item) => Number.isInteger(item) && item >= 1 && item <= 80);
	return [...new Set(years)].sort((a, b) => a - b);
}

function asKind(value: unknown): TemplateKind {
	const kind = String(value ?? "");
	if (
		kind === "employee_day_of" ||
		kind === "manager_monthly" ||
		kind === "ceo_anniversary" ||
		kind === "ceo_monthly"
	) {
		return kind;
	}
	if (kind === "birthday" || kind === "anniversary") return "employee_day_of";
	return "manager_monthly";
}

function legacyType(kind: TemplateKind, milestoneTypes: MilestoneType[]) {
	if (kind === "manager_monthly") return "manager_monthly";
	if (kind === "ceo_anniversary") return "ceo_anniversary";
	if (kind === "ceo_monthly") return "ceo_monthly";
	return milestoneTypes.includes("birthday") && milestoneTypes.length === 1
		? "birthday"
		: "anniversary";
}

export async function listEmployees(): Promise<EmployeeRow[]> {
	const pool = await sqlPool();
	await ensurePrimepulse(pool);
	const columns = await employeeColumns(pool);
	const nameSql = displayNameSql(columns);
	const workEmail = optionalSql(columns, WORK_EMAIL_COLUMNS, "workEmail");
	const personalEmail = optionalSql(
		columns,
		PERSONAL_EMAIL_COLUMNS,
		"personalEmail",
	);
	const managerOid = optionalSql(columns, MANAGER_OID_COLUMNS, "managerOID");
	const managerName = optionalSql(columns, MANAGER_NAME_COLUMNS, "managerName");
	const result = await pool.request().query(`
		SELECT
			${OID} AS associateOID,
			COALESCE(MAX(${nameSql}), MAX(${OID})) AS displayName,
			${workEmail},
			${personalEmail},
			MAX(${storedDateSql("e.[workerDates_originalHireDate]")}) AS originalHireDate,
			MAX(${storedDateSql("e.[workAssignments_0_seniorityDate]")}) AS seniorityDate,
			MAX(${storedDateSql("e.[person_birthDate]")}) AS birthDate,
			${managerOid},
			${managerName}
		FROM [adp].[Employee] e
		WHERE ${ACTIVE}
		GROUP BY ${OID}
		ORDER BY displayName, associateOID
	`);
	const rows = (result.recordset ?? []).map((row: Record<string, unknown>) => {
		const originalHireDate = dateOrNull(row.originalHireDate);
		const seniorityDate = dateOrNull(row.seniorityDate);
		const anniversarySource: AnniversarySource | null = originalHireDate
			? "originalHireDate"
			: seniorityDate
				? "seniorityDate"
				: null;
		return {
			associateOID: String(row.associateOID ?? ""),
			displayName: String(row.displayName ?? row.associateOID ?? ""),
			email:
				String(row.workEmail ?? "").trim() ||
				String(row.personalEmail ?? "").trim() ||
				null,
			anniversaryDate: originalHireDate ?? seniorityDate,
			anniversarySource,
			birthDate: dateOrNull(row.birthDate),
			managerOID: String(row.managerOID ?? "").trim() || null,
			managerName: String(row.managerName ?? "").trim() || null,
			managerEmail: null as string | null,
		};
	});
	const emailByOid = new Map(
		rows.map((row) => [row.associateOID, row.email] as const),
	);
	return rows.map((row) => ({
		...row,
		managerEmail: row.managerOID
			? (emailByOid.get(row.managerOID) ?? null)
			: null,
	}));
}

function templateRow(row: Record<string, unknown>): EmailTemplate {
	const kind = asKind(row.kind ?? row.type);
	const milestoneTypes = asMilestoneTypes(row.milestoneTypes);
	return {
		id: Number(row.id),
		name: String(row.name ?? ""),
		kind,
		milestoneTypes:
			kind === "ceo_anniversary" ? ["anniversary"] : milestoneTypes,
		daysBeforeMonthStart: Number(row.daysBeforeMonthStart ?? 14),
		anniversaryYears:
			kind === "ceo_anniversary"
				? asYears(row.anniversaryYears).length
					? asYears(row.anniversaryYears)
					: DEFAULT_ANNIVERSARY_YEARS
				: asYears(row.anniversaryYears),
		recipientEmails: asEmails(row.recipientEmails),
		sendAt: normalizeSendAt(String(row.sendAt ?? "")),
		emailSubject: String(row.emailSubject ?? ""),
		emailBody: String(row.emailBody ?? ""),
		enabled: String(row.enabled) !== "false" && Number(row.enabled) !== 0,
		createdAt: timestamp(row.createdAt),
		updatedAt: timestamp(row.updatedAt),
	};
}

const TEMPLATE_COLUMNS = `
	id, [name] AS name, [type] AS type, kind, milestoneTypes, daysBeforeMonthStart,
	anniversaryYears, recipientEmails, sendAt, emailSubject, emailBody, enabled,
	CONVERT(varchar(33), createdAt, 126) AS createdAt,
	CONVERT(varchar(33), updatedAt, 126) AS updatedAt
`;

export async function listTemplates(): Promise<EmailTemplate[]> {
	const pool = await sqlPool();
	await ensurePrimepulse(pool);
	const result = await pool.request().query(`
		SELECT ${TEMPLATE_COLUMNS}
		FROM [primepulse].[EmailTemplate]
		ORDER BY kind, [name]
	`);
	return (result.recordset ?? []).map(templateRow);
}

export async function saveTemplate(input: SaveTemplateInput) {
	const pool = await sqlPool();
	await ensurePrimepulse(pool);
	const request = pool.request();
	const kind = input.kind;
	const milestoneTypes: MilestoneType[] =
		kind === "ceo_anniversary" ? ["anniversary"] : input.milestoneTypes;
	request.input("name", sql.NVarChar(200), input.name);
	request.input("type", sql.NVarChar(32), legacyType(kind, milestoneTypes));
	request.input("kind", sql.NVarChar(32), kind);
	request.input(
		"milestoneTypes",
		sql.NVarChar(sql.MAX),
		JSON.stringify(milestoneTypes),
	);
	request.input("lead", sql.Int, input.daysBeforeMonthStart);
	request.input(
		"years",
		sql.NVarChar(sql.MAX),
		JSON.stringify(
			kind === "ceo_anniversary"
				? [...new Set(input.anniversaryYears)].sort((a, b) => a - b)
				: [],
		),
	);
	request.input(
		"recipients",
		sql.NVarChar(sql.MAX),
		JSON.stringify(input.recipientEmails),
	);
	request.input("sendAt", sql.NVarChar(5), normalizeSendAt(input.sendAt));
	request.input("subject", sql.NVarChar(400), input.emailSubject);
	request.input("body", sql.NVarChar(sql.MAX), input.emailBody);
	request.input("enabled", sql.Bit, input.enabled);
	try {
		if (input.id == null) {
			await request.query(`
				INSERT INTO [primepulse].[EmailTemplate]
					([name], [type], kind, milestoneTypes, daysBeforeMonthStart, anniversaryYears, recipientEmails, sendAt, emailSubject, emailBody, enabled)
				VALUES (@name, @type, @kind, @milestoneTypes, @lead, @years, @recipients, @sendAt, @subject, @body, @enabled)
			`);
			return;
		}
		request.input("id", sql.Int, input.id);
		const result = await request.query(`
			UPDATE [primepulse].[EmailTemplate]
			SET [name] = @name,
				[type] = @type,
				kind = @kind,
				milestoneTypes = @milestoneTypes,
				daysBeforeMonthStart = @lead,
				anniversaryYears = @years,
				recipientEmails = @recipients,
				sendAt = @sendAt,
				emailSubject = @subject,
				emailBody = @body,
				enabled = @enabled,
				updatedAt = SYSUTCDATETIME()
			WHERE id = @id;
			SELECT @@ROWCOUNT AS updated;
		`);
		if (Number(result.recordset?.[0]?.updated ?? 0) !== 1) {
			throw new Error("That template is no longer on file");
		}
	} catch (error) {
		if (sqlNumber(error) === 2627 || sqlNumber(error) === 2601) {
			throw new Error("A template with that name already exists");
		}
		throw error;
	}
}

export async function deleteTemplate(id: number) {
	const pool = await sqlPool();
	await ensurePrimepulse(pool);
	const request = pool.request();
	request.input("id", sql.Int, id);
	const result = await request.query(`
		DELETE FROM [primepulse].[SendSkip] WHERE templateId = @id;
		DELETE FROM [primepulse].[EmailTemplate] WHERE id = @id;
		SELECT @@ROWCOUNT AS deleted;
	`);
	if (Number(result.recordset?.[0]?.deleted ?? 0) !== 1) {
		throw new Error("That template is no longer on file");
	}
}

async function listSkips(): Promise<SendSkipRef[]> {
	const pool = await sqlPool();
	await ensurePrimepulse(pool);
	const result = await pool.request().query(`
		SELECT templateId, associateOID, milestoneType, milestoneDate
		FROM [primepulse].[SendSkip]
	`);
	return (result.recordset ?? []).flatMap((row: Record<string, unknown>) => {
		const milestoneType = String(row.milestoneType ?? "");
		if (milestoneType !== "birthday" && milestoneType !== "anniversary") {
			return [];
		}
		return [
			{
				templateId: Number(row.templateId),
				associateOID: String(row.associateOID ?? ""),
				milestoneType,
				milestoneDate: String(row.milestoneDate ?? "").slice(0, 10),
			},
		];
	});
}

export async function addSkip(input: SendSkipRef) {
	const pool = await sqlPool();
	await ensurePrimepulse(pool);
	const request = pool.request();
	request.input("templateId", sql.Int, input.templateId);
	request.input("associateOID", sql.NVarChar(128), input.associateOID);
	request.input("milestoneType", sql.NVarChar(32), input.milestoneType);
	request.input(
		"milestoneDate",
		sql.NVarChar(10),
		input.milestoneDate.slice(0, 10),
	);
	try {
		await request.query(`
			INSERT INTO [primepulse].[SendSkip]
				(templateId, associateOID, milestoneType, milestoneDate)
			VALUES (@templateId, @associateOID, @milestoneType, @milestoneDate)
		`);
	} catch (error) {
		if (sqlNumber(error) === 2627 || sqlNumber(error) === 2601) return;
		throw error;
	}
}

export async function removeSkip(input: SendSkipRef) {
	const pool = await sqlPool();
	await ensurePrimepulse(pool);
	const request = pool.request();
	request.input("templateId", sql.Int, input.templateId);
	request.input("associateOID", sql.NVarChar(128), input.associateOID);
	request.input("milestoneType", sql.NVarChar(32), input.milestoneType);
	request.input(
		"milestoneDate",
		sql.NVarChar(10),
		input.milestoneDate.slice(0, 10),
	);
	await request.query(`
		DELETE FROM [primepulse].[SendSkip]
		WHERE templateId = @templateId
			AND associateOID = @associateOID
			AND milestoneType = @milestoneType
			AND milestoneDate = @milestoneDate
	`);
}

export async function listUpcoming(): Promise<UpcomingBoard> {
	const [templates, employees] = await Promise.all([
		listTemplates(),
		listEmployees(),
	]);
	const today = todayIso();
	const built = upcomingSends(templates, employees, today, formatDate);
	const skips = await listSkips();
	const { sends, skipped } = applySendSkips(
		built,
		skips,
		templates,
		formatDate,
	);
	return {
		sends,
		skipped,
		readiness: readinessReport(templates, employees, built),
		templatesOn: templates.filter((template) => template.enabled).length,
		today,
	};
}

function sqlNumber(error: unknown) {
	if (!error || typeof error !== "object") return undefined;
	const record = error as {
		number?: number;
		originalError?: { info?: { number?: number } };
	};
	return record.number ?? record.originalError?.info?.number;
}
