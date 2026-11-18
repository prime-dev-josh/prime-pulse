import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "#/components/app-shell";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { dateNote, formatDate } from "#/lib/dates";
import { todayIso, yearsOn } from "#/lib/schedule";
import { getEmployees } from "#/server/functions";

function sourceLabel(source: "originalHireDate" | "seniorityDate" | null) {
	if (source === "originalHireDate") return "Hire date";
	if (source === "seniorityDate") return "Seniority date";
	return "No hire or seniority date";
}

export function EmployeesScreen() {
	const employees = useQuery({
		queryKey: ["employees"],
		queryFn: () => getEmployees(),
		retry: false,
	});
	const [search, setSearch] = useState("");
	const today = todayIso();

	const rows = useMemo(() => {
		const query = search.trim().toLowerCase();
		return (employees.data ?? []).filter((employee) => {
			if (!query) return true;
			return (
				employee.displayName.toLowerCase().includes(query) ||
				employee.associateOID.toLowerCase().includes(query) ||
				(employee.managerName ?? "").toLowerCase().includes(query) ||
				(employee.email ?? "").toLowerCase().includes(query)
			);
		});
	}, [employees.data, search]);

	return (
		<AppShell
			heading="Employees"
			title="Active ADP people (status A). Dates and managers here drive the templates — they are not stored as separate milestone rows."
		>
			<section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm">
				<div className="shrink-0 border-b border-[var(--line)] p-4">
					<Input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search name, email, manager, or associate OID"
						aria-label="Search employees"
						className="bg-white"
					/>
				</div>
				{employees.isPending ? (
					<p className="p-6 text-sm text-[var(--sea-ink-soft)]">
						Reading active employees from ADP…
					</p>
				) : null}
				{employees.isError ? (
					<div className="space-y-3 p-6">
						<p className="text-sm text-destructive" role="alert">
							{employees.error instanceof Error
								? employees.error.message
								: "Could not read employees"}
						</p>
						<Button variant="outline" onClick={() => employees.refetch()}>
							Try again
						</Button>
					</div>
				) : null}
				{employees.data ? (
					<div className="min-h-0 flex-1 overflow-auto">
						<table className="w-full min-w-[760px] text-left text-sm">
							<caption className="sr-only">
								Active employees and milestone dates
							</caption>
							<thead className="sticky top-0 bg-[var(--brand-tint-25)] text-xs uppercase tracking-wide text-[var(--brand-indigo-light)]">
								<tr>
									<th className="px-4 py-3 font-semibold">Employee</th>
									<th className="px-3 py-3 font-semibold">Manager</th>
									<th className="px-3 py-3 font-semibold">Anniversary</th>
									<th className="px-3 py-3 font-semibold">Birthday</th>
									<th className="px-4 py-3 font-semibold">Years</th>
								</tr>
							</thead>
							<tbody>
								{rows.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="px-4 py-8 text-[var(--sea-ink-soft)]"
										>
											{employees.data.length === 0
												? "No active employees matched status A."
												: "No employees match this view."}
										</td>
									</tr>
								) : (
									rows.map((employee) => {
										const years = yearsOn(employee.anniversaryDate, today);
										return (
											<tr
												key={employee.associateOID}
												className="border-t border-[var(--line)] align-top"
											>
												<td className="px-4 py-3">
													<div className="font-semibold">
														{employee.displayName}
													</div>
													<div className="text-xs text-[var(--sea-ink-soft)]">
														{employee.email ?? "No email in ADP"}
													</div>
												</td>
												<td className="px-3 py-3">
													<div>{employee.managerName ?? "—"}</div>
													<div className="text-xs text-[var(--sea-ink-soft)]">
														{employee.managerEmail ?? ""}
													</div>
												</td>
												<td className="px-3 py-3">
													<div>{formatDate(employee.anniversaryDate)}</div>
													<div className="text-xs text-[var(--sea-ink-soft)]">
														{sourceLabel(employee.anniversarySource)}
													</div>
												</td>
												<td className="px-3 py-3">
													<div>{formatDate(employee.birthDate)}</div>
													{dateNote(employee.birthDate) ? (
														<div className="text-xs text-[var(--sea-ink-soft)]">
															{dateNote(employee.birthDate)}
														</div>
													) : null}
												</td>
												<td className="px-4 py-3">
													{years == null ? "—" : years}
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				) : null}
			</section>
		</AppShell>
	);
}
