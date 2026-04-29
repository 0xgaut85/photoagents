export type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string;
  status: "active" | "revoked";
};

export type UsagePoint = {
  date: string;
  requests: number;
  images: number;
};

export type EndpointUsage = {
  endpoint: string;
  requests: number;
  latency: string;
  success: string;
};

export type Invoice = {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "open";
};

export type TeamMember = {
  id: string;
  name: string;
  identifier: string;
  role: "Owner" | "Developer" | "Viewer";
  joined: string;
};

export const mockKeys: ApiKey[] = [
  {
    id: "key_live_01",
    name: "Production agent",
    prefix: "pk_live_••••a91c",
    createdAt: "Apr 29, 2026",
    lastUsed: "2 minutes ago",
    status: "active",
  },
  {
    id: "key_test_01",
    name: "Local experiments",
    prefix: "pk_test_••••73bf",
    createdAt: "Apr 24, 2026",
    lastUsed: "Yesterday",
    status: "active",
  },
  {
    id: "key_old_01",
    name: "Prototype",
    prefix: "pk_live_••••019d",
    createdAt: "Apr 11, 2026",
    lastUsed: "Never",
    status: "revoked",
  },
];

export const mockUsageSeries: UsagePoint[] = [
  { date: "Mar 31", requests: 420, images: 211 },
  { date: "Apr 01", requests: 520, images: 244 },
  { date: "Apr 02", requests: 760, images: 391 },
  { date: "Apr 03", requests: 680, images: 322 },
  { date: "Apr 04", requests: 910, images: 491 },
  { date: "Apr 05", requests: 1120, images: 603 },
  { date: "Apr 06", requests: 1030, images: 571 },
  { date: "Apr 07", requests: 1240, images: 622 },
  { date: "Apr 08", requests: 1410, images: 703 },
  { date: "Apr 09", requests: 1380, images: 688 },
  { date: "Apr 10", requests: 1590, images: 771 },
  { date: "Apr 11", requests: 1710, images: 802 },
  { date: "Apr 12", requests: 1530, images: 722 },
  { date: "Apr 13", requests: 1800, images: 864 },
  { date: "Apr 14", requests: 1930, images: 910 },
  { date: "Apr 15", requests: 2100, images: 999 },
  { date: "Apr 16", requests: 2240, images: 1060 },
  { date: "Apr 17", requests: 2170, images: 1024 },
  { date: "Apr 18", requests: 2380, images: 1132 },
  { date: "Apr 19", requests: 2510, images: 1190 },
  { date: "Apr 20", requests: 2440, images: 1164 },
  { date: "Apr 21", requests: 2620, images: 1250 },
  { date: "Apr 22", requests: 2790, images: 1322 },
  { date: "Apr 23", requests: 3010, images: 1411 },
  { date: "Apr 24", requests: 2920, images: 1378 },
  { date: "Apr 25", requests: 3180, images: 1510 },
  { date: "Apr 26", requests: 3390, images: 1594 },
  { date: "Apr 27", requests: 3500, images: 1640 },
  { date: "Apr 28", requests: 3710, images: 1768 },
  { date: "Apr 29", requests: 3890, images: 1844 },
];

export const mockEndpointUsage: EndpointUsage[] = [
  { endpoint: "/v1/vision/read", requests: 18290, latency: "481ms", success: "99.4%" },
  { endpoint: "/v1/vision/locate", requests: 9210, latency: "522ms", success: "98.8%" },
  { endpoint: "/v1/agent/observe", requests: 6420, latency: "610ms", success: "99.1%" },
  { endpoint: "/v1/files/extract", requests: 3100, latency: "734ms", success: "97.9%" },
];

export const mockInvoices: Invoice[] = [
  { id: "INV-0004", date: "Apr 29, 2026", amount: "$15.00", status: "paid" },
  { id: "INV-0003", date: "Mar 29, 2026", amount: "$15.00", status: "paid" },
  { id: "INV-0002", date: "Feb 29, 2026", amount: "$15.00", status: "paid" },
];

export const mockTeam: TeamMember[] = [
  {
    id: "user_01",
    name: "Merel",
    identifier: "merelnyc",
    role: "Owner",
    joined: "Apr 29, 2026",
  },
  {
    id: "user_02",
    name: "Build agent",
    identifier: "0x7c19…a4f2",
    role: "Developer",
    joined: "Apr 28, 2026",
  },
  {
    id: "user_03",
    name: "Observer",
    identifier: "ops@photoagents.ai",
    role: "Viewer",
    joined: "Apr 24, 2026",
  },
];

export const plan = {
  name: "Photo API",
  price: "$15/mo",
  limit: 50000,
  used: 38900,
};
