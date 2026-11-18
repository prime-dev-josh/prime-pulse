declare module "mssql" {
	// mssql's published types are incomplete in this toolchain.
	const sql: {
		ConnectionPool: new (
			config: unknown,
		) => {
			connect: () => Promise<{
				connected?: boolean;
				request: () => SqlRequest;
				close: () => Promise<void>;
			}>;
			close: () => Promise<void>;
		};
		Transaction: new (
			pool: unknown,
		) => {
			begin: () => Promise<void>;
			commit: () => Promise<void>;
			rollback: () => Promise<void>;
			request: () => SqlRequest;
		};
		Request: new (parent: unknown) => SqlRequest;
		NVarChar: (length: unknown) => unknown;
		Int: unknown;
		Bit: unknown;
		MAX: unknown;
	};
	export default sql;

	interface SqlRequest {
		input: (name: string, type: unknown, value: unknown) => void;
		query: (statement: string) => Promise<{
			recordset?: Array<Record<string, unknown>>;
		}>;
	}
}
