mau@mau:~/projeto/consulta/frontend-admin$ npm run lint

> frontend-admin@1.0.0 lint
> next lint


./src/components/Header.tsx
13:3  Error: 'ChevronDown' is defined but never used.  @typescript-eslint/no-unused-vars
32:34  Error: 'userRole' is assigned a value but never used.  @typescript-eslint/no-unused-vars

./src/components/PluginManager.tsx
11:82  Error: 'DropdownMenuSeparator' is defined but never used.  @typescript-eslint/no-unused-vars
12:71  Error: 'Package' is defined but never used.  @typescript-eslint/no-unused-vars
12:86  Error: 'Pause' is defined but never used.  @typescript-eslint/no-unused-vars
20:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
43:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
69:19  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
200:45  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
200:67  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities

./src/components/Sidebar.tsx
107:16  Error: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
112:16  Error: 'e' is defined but never used.  @typescript-eslint/no-unused-vars

./src/components/ui/input.tsx
5:18  Error: An interface declaring no members is equivalent to its supertype.  @typescript-eslint/no-empty-object-type

./src/hooks/useTheme.ts
9:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/lib/api/audit.ts
8:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
70:49  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/lib/api/billing.ts
22:90  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/lib/api/plugins.ts
23:66  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/pages/_app.tsx
11:11  Error: 'theme' is assigned a value but never used.  @typescript-eslint/no-unused-vars
20:16  Error: 'e' is defined but never used.  @typescript-eslint/no-unused-vars
33:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/pages/audit.tsx
25:3  Error: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
26:3  Error: 'XCircle' is defined but never used.  @typescript-eslint/no-unused-vars
38:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
72:6  Warning: React Hook useEffect has a missing dependency: 'loadAuditLogs'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
76:6  Warning: React Hook useEffect has a missing dependency: 'loadAuditLogs'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
91:22  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
112:22  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/pages/billing.tsx
25:3  Error: 'AlertTriangle' is defined but never used.  @typescript-eslint/no-unused-vars
65:6  Warning: React Hook useEffect has a missing dependency: 'loadBillingItems'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
69:6  Warning: React Hook useEffect has a missing dependency: 'loadBillingItems'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
84:22  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
134:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/pages/index.tsx
12:3  Error: 'BarChart' is defined but never used.  @typescript-eslint/no-unused-vars
13:3  Error: 'Bar' is defined but never used.  @typescript-eslint/no-unused-vars
85:7  Error: 'COLORS' is assigned a value but never used.  @typescript-eslint/no-unused-vars
130:6  Warning: React Hook useEffect has a missing dependency: 'fetchDashboardData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

./src/pages/login.tsx
35:14  Error: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
88:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/pages/minha-conta.tsx
52:6  Warning: React Hook useEffect has a missing dependency: 'theme'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps

./src/pages/plugins/pricing.tsx
383:47  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
383:61  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities

./src/pages/plugins.tsx
14:66  Error: 'Play' is defined but never used.  @typescript-eslint/no-unused-vars
14:72  Error: 'Pause' is defined but never used.  @typescript-eslint/no-unused-vars
22:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
58:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
98:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
148:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
255:14  Error: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
546:45  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
546:67  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
724:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
820:59  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
820:80  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities

./src/pages/settings.tsx
19:3  Error: 'Info' is defined but never used.  @typescript-eslint/no-unused-vars
21:3  Error: 'Zap' is defined but never used.  @typescript-eslint/no-unused-vars
89:6  Warning: React Hook useEffect has a missing dependency: 'validate'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
216:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
220:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any

./src/pages/tenant-plugins.tsx
11:10  Error: 'Switch' is defined but never used.  @typescript-eslint/no-unused-vars
12:10  Error: 'Tabs' is defined but never used.  @typescript-eslint/no-unused-vars
12:16  Error: 'TabsContent' is defined but never used.  @typescript-eslint/no-unused-vars
12:29  Error: 'TabsList' is defined but never used.  @typescript-eslint/no-unused-vars
12:39  Error: 'TabsTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
23:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
38:11  Error: 'TenantPluginConfig' is defined but never used.  @typescript-eslint/no-unused-vars
60:77  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
103:6  Warning: React Hook useEffect has a missing dependency: 'loadPlugins'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
283:14  Error: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
547:45  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
547:65  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
680:72  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
680:89  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
856:44  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
856:51  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
899:55  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
899:72  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities

./src/pages/users.tsx
7:60  Error: 'DialogTrigger' is defined but never used.  @typescript-eslint/no-unused-vars
12:55  Error: 'CheckCircle' is defined but never used.  @typescript-eslint/no-unused-vars
12:68  Error: 'XCircle' is defined but never used.  @typescript-eslint/no-unused-vars
12:92  Error: 'Mail' is defined but never used.  @typescript-eslint/no-unused-vars
32:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
40:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
130:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
155:14  Error: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
181:14  Error: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
220:14  Error: 'err' is defined but never used.  @typescript-eslint/no-unused-vars

info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/basic-features/eslint#disabling-rules
mau@mau:~/projeto/consulta/frontend-admin$ 