import { DATE_RANGE_PRESETS } from "@/lib/constants/general";
import {
	NavigationGroup,
	NavigationLink,
	ShortcutLink,
} from "@/lib/constants/interface";
import {
	ChequeCollectionSchema,
	userProfileSchema,
} from "@/lib/constants/schema";
import { RemixiconComponentType } from "@remixicon/react";
import { LucideIcon } from "lucide-react";
import z from "zod";

// Shared utility types
export type Sorting = { id: string; desc: boolean }[];
export type UnitChoice = "pcs" | "ft" | "kg" | "roll" | "box";
export type Roles = "admin" | "manager" | "clerk" | "guest";
export type NavigationEntry = NavigationLink | NavigationGroup;
export type ShortcutEntry = ShortcutLink;

export type ShopInfo = {
	name: string;
	description: string;
	address: string;
	contactEmail: string;
};

export type PaginatedFilterProps = {
	page?: number;
	limit?: number;
	search?: string;
	ordering?: string;
	start_date?: string;
	end_date?: string;
	filter?: Record<string, unknown>;
};

// Generic paginated response
export type PaginatedResult<T> = {
	count: number;
	next: string | null;
	previous: string | null;
	results: T[];
};

// Authentication
export type LoginFormValues = {
	username: string;
	password: string;
	remember_me?: boolean;
};

// Location
export type Barangay = {
	code: string;
	legacyCode: string;
	name: string;
	isUrban: boolean;
	isRural: boolean;
	population: number;
	region: string;
	city: string;
};

export type City = {
	code: string;
	legacyCode: string;
	name: string;
	isUrban: boolean;
	isRural: boolean;
	population: number;
	region: string;
	province: string;
};

export type Province = {
	code: string;
	legacyCode: string;
	name: string;
	isUrban: boolean;
	isRural: boolean;
	population: number;
	region: string;
};

// Common entity fields
export type BaseEntity = {
	id: number;
	is_deleted?: boolean;
	created_at?: string;
	updated_at?: string;
};

// Client
export type Client = BaseEntity & {
	full_name: string;
	contact_number?: string | null;
	address?: string | null;
	province: string;
	city: string;
	barangay?: string | null;
	is_blocklisted: boolean;
};

export type ClientPayload = Omit<Client, keyof BaseEntity>;

// Technician
export type Technician = BaseEntity & {
	role?: string;
	is_active?: boolean;
	email?: string;
	birthday?: string;
	first_name: string;
	last_name: string;
	contact_number: string;
	address: string;
	province: string;
	city: string;
	barangay: string;
	sss_number?: string;
	tin_number?: string;
	philhealth_number?: string;
	basic_salary?: number;
	profile_image?: string;
};

// Navigation

export type NavItem = {
	name: string;
	href?: string;
	icon: LucideIcon | RemixiconComponentType;
	action?: string;
	children?: NavItem[];
};

export type NavListItem = {
	items: NavItem[];
	activePath: string;
	close?: () => void;
	onAction?: (action: string) => void;
	title?: string;
	level?: number;
	href?: string;
	children?: NavListItem[];
};

export type CursorPaginatedResponse<TItem> = {
	results: TItem[];
	next: string | null;
	previous: string | null;
};

export type TUserProfile = z.infer<typeof userProfileSchema>;

export type UserProfilePayload = Omit<TUserProfile, "birthday"> & {
	birthday?: string;
};

export type DateRangePresetLabel = (typeof DATE_RANGE_PRESETS)[number]["label"];

export type SortState = {
	id: string;
	desc: boolean;
};

export type ChequeCollectionPayload = z.infer<typeof ChequeCollectionSchema>;

export type ComboboxOption = {
	value: string | number;
	label: string;
};

export type TimeEntry = {
	id: number;
	employee: number;

	clock_in: string; // ISO DateTime
	clock_out: string; // ISO DateTime

	unpaid_break_minutes: number;

	source: "manual" | "schedule" | "import";

	approved: boolean;

	notes?: string;

	auto_closed: boolean;

	is_deleted: boolean;

	created_at: string;
	updated_at: string;

	// Computed (server-side) helpers may be attached
	effective_hours?: number;
	work_date?: string;
};

export type AdditionalEarning = {
	id: number;
	employee: number;

	earning_date: string; // ISO Date

	category: "overtime" | "installation_pct" | "custom";

	amount: string | number;

	description?: string;

	reference?: string;

	approved: boolean;

	is_deleted: boolean;

	created_at: string;
	updated_at: string;
};

export type WeeklyPayroll = {
	id: number;
	employee: number;

	employee_name?: string;

	week_start: string; // ISO Date
	week_end?: string; // ISO Date

	hourly_rate: string | number;

	overtime_threshold: string | number;
	overtime_multiplier: string | number;

	regular_hours: string | number;
	overtime_hours: string | number;

	night_diff_hours: string | number;
	approved_ot_hours: string | number;

	allowances: string | number;

	additional_earnings_total: string | number;

	gross_pay: string | number;

	night_diff_pay: string | number;
	approved_ot_pay: string | number;

	deductions: Record<string, string | number>;
	total_deductions: string | number;

	net_pay: string | number;

	status: "draft" | "approved" | "paid";

	notes?: string;

	is_deleted: boolean;

	created_at: string;
	updated_at: string;
};
