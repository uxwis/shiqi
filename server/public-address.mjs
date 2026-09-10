import { isIP } from "node:net";

// Public websites only. Validate every redirect and pin the connection to the
// checked DNS address so user-submitted URLs cannot reach internal services.
export function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && [0, 168].includes(b)) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && [18, 19, 51].includes(b)) ||
      (a === 203 && b === 0)
    );
  }
  // Only globally routable IPv6 unicast; excludes mapped IPv4 and local ranges.
  return (
    isIP(address) === 6 &&
    /^[23]/i.test(address) &&
    !/^2001:(?:0:|db8:|[12][0-9a-f]:)/i.test(address) &&
    !/^2002:/i.test(address)
  );
}
