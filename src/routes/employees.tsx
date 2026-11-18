import { createFileRoute } from "@tanstack/react-router";
import { EmployeesScreen } from "#/components/employees-screen";

export const Route = createFileRoute("/employees")({
	component: EmployeesScreen,
});
