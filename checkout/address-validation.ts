export type AddressVerdict = {
  addressComplete?: boolean;
  validationGranularity?: string;
  hasUnconfirmedComponents?: boolean;
};

type ValidatedAddress = {
  formattedAddress?: string;
  missingComponentTypes?: string[];
  unresolvedTokens?: string[];
};

/** A suggestion is not proof of deliverability. Require a complete premise-level verdict. */
export function isConfirmedAddress(verdict?: AddressVerdict, address?: ValidatedAddress) {
  return Boolean(
    verdict?.addressComplete === true &&
    ["PREMISE", "SUB_PREMISE"].includes(verdict.validationGranularity || "") &&
    !verdict.hasUnconfirmedComponents &&
    address?.formattedAddress &&
    !address.missingComponentTypes?.length &&
    !address.unresolvedTokens?.length
  );
}
