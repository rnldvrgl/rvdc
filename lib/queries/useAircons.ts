import {
	AirconBrands,
	AirconModels,
	AirconUnits,
	WarrantyClaim,
} from "@/lib/constants/interface";
import type { PaginatedFilterProps } from "@/lib/constants/types";
import { useFilters } from "@/lib/hooks/useFilters";
import { usePaginatedQuery } from "@/lib/hooks/usePaginatedQuery";

const installationsUrl = "/installations/";

export function useAirconBrands(props: PaginatedFilterProps = {}) {
	return usePaginatedQuery<AirconBrands>({
		...props,
		url: `${installationsUrl}aircon-brands/`,
		queryKeyBase: "aircon-brands",
	});
}

export function useAirconModels(props: PaginatedFilterProps = {}) {
	return usePaginatedQuery<AirconModels>({
		...props,
		url: `${installationsUrl}aircon-models/`,
		queryKeyBase: "aircon-models",
	});
}

export function useAirconUnits(props: PaginatedFilterProps = {}) {
	return usePaginatedQuery<AirconUnits>({
		...props,
		url: `${installationsUrl}aircon-units/`,
		queryKeyBase: "aircon-units",
	});
}

export function useAirconInstallations(props: PaginatedFilterProps = {}) {
	return usePaginatedQuery({
		...props,
		url: `${installationsUrl}aircon-installations/`,
		queryKeyBase: "aircon-installations",
	});
}

// FILTERS
export function useAirconModelFilters() {
	return useFilters(
		"aircon-model-filters",
		`${installationsUrl}aircon-models/filters/`,
	);
}

export function useAirconUnitFilters() {
	return useFilters(
		"aircon-unit-filters",
		`${installationsUrl}aircon-units/filters/`,
	);
}

export function useAirconInstallationFilters() {
	return useFilters(
		"aircon-installation-filters",
		`${installationsUrl}aircon-installations/filters/`,
	);
}

export function useWarrantyClaims(props: PaginatedFilterProps = {}) {
	return usePaginatedQuery<WarrantyClaim>({
		...props,
		url: `${installationsUrl}warranty-claims/`,
		queryKeyBase: "warranty-claims",
	});
}

export function useWarrantyClaimFilters() {
	return useFilters(
		"warranty-claim-filters",
		`${installationsUrl}warranty-claims/filters/`,
	);
}
