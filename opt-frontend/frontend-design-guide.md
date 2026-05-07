# 🎨 Frontend Design Guide — ReactJS (TSX) + TailwindCSS

> Tài liệu hướng dẫn AI thiết kế frontend theo phong cách **Clean SaaS Dashboard** — lấy cảm hứng từ các reference UI hiện đại với theme xanh dương nhạt, card-based layout, shadow tinh tế và data visualization rõ ràng.

---

## 1. 🎯 Design Philosophy

### Phong cách tổng thể
- **Aesthetic Direction**: Soft Neomorphic SaaS — Clean, airy, professional
- **Cảm húc**: Tin cậy, hiện đại, dễ đọc, không gây mệt mỏi khi nhìn lâu
- **Nguyên tắc cốt lõi**:
  - Mọi thứ đều cần **breathing room** — padding và whitespace rộng rãi
  - Thông tin được phân cấp rõ ràng (hierarchy: to → nhỏ, đậm → nhạt)
  - Interactive elements phải có **micro-feedback** (hover, active, focus states)
  - Data luôn là nhân vật chính — mọi decoration phục vụ data, không che khuất

---

## 2. 🎨 Color System

### Primary Palette
```css
/* Định nghĩa trong tailwind.config.ts hoặc CSS variables */
--color-primary-50:  #EEF2FF;   /* bg nhạt nhất, dùng cho hover state */
--color-primary-100: #E0E7FF;   /* bg card active */
--color-primary-400: #818CF8;   /* accent nhẹ */
--color-primary-500: #6366F1;   /* màu chính — button, badge, highlight */
--color-primary-600: #4F46E5;   /* hover button */
--color-primary-700: #4338CA;   /* active / pressed */

/* Màu xanh dương (dùng song song cho Wi-Fi, network status) */
--color-blue-500: #3B82F6;
--color-blue-600: #2563EB;
```

### Neutral Palette
```css
--color-gray-50:  #F8FAFC;   /* page background */
--color-gray-100: #F1F5F9;   /* card bg phụ, input bg */
--color-gray-200: #E2E8F0;   /* border, divider */
--color-gray-400: #94A3B8;   /* placeholder, label phụ */
--color-gray-600: #475569;   /* body text */
--color-gray-800: #1E293B;   /* heading, label chính */
--color-gray-900: #0F172A;   /* title lớn */
```

### Semantic Colors
```css
--color-success: #22C55E;    /* Online, Active, Strong signal */
--color-warning: #F59E0B;    /* Caution, Expiring */
--color-danger:  #EF4444;    /* Error, Blocked */
--color-info:    #06B6D4;    /* Neutral info */
```

### Background & Surface
```css
/* Page background: gradient nhẹ */
background: linear-gradient(135deg, #EEF2FF 0%, #F8FAFC 50%, #E0E7FF 100%);

/* Card surface */
background: #FFFFFF;
/* Hoặc glassmorphism nhẹ */
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(12px);
```

---

## 3. 📐 Typography

### Font Pairing
```ts
// tailwind.config.ts
fontFamily: {
  display: ['Plus Jakarta Sans', 'sans-serif'],  // Heading, số liệu lớn
  body:    ['DM Sans', 'sans-serif'],             // Body text, label
  mono:    ['JetBrains Mono', 'monospace'],       // Code, IP address, ID
}
```

> ⚠️ **Không dùng**: Inter, Roboto, Arial — quá phổ thông, thiếu cá tính.

### Scale (dùng Tailwind utilities)
| Role | Class | Size | Weight |
|------|-------|------|--------|
| Page Title | `text-3xl font-bold font-display` | 30px | 700 |
| Section Title | `text-xl font-semibold font-display` | 20px | 600 |
| Card Title | `text-base font-semibold font-body` | 16px | 600 |
| Body | `text-sm font-normal font-body` | 14px | 400 |
| Label/Caption | `text-xs font-medium font-body` | 12px | 500 |
| Big Number | `text-4xl font-bold font-display` | 36px | 700 |
| Stat Number | `text-2xl font-bold font-display` | 24px | 700 |

### Số liệu (Metrics)
- Số lớn như `$43,871`, `2,923` → dùng `font-display` + `font-bold` + màu `gray-900`
- Phần trăm thay đổi (`+15%`) → dùng `text-xs font-semibold` + màu semantic (green/red)
- Sub-label bên dưới số → `text-xs text-gray-400`

---

## 4. 🃏 Card System

### Base Card
```tsx
// components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

const Card = ({ children, className, hover, glass }: CardProps) => (
  <div
    className={cn(
      // Base
      'rounded-2xl p-5 border border-gray-100',
      // Surface
      glass
        ? 'bg-white/80 backdrop-blur-md'
        : 'bg-white',
      // Shadow — dấu hiệu nhận dạng quan trọng nhất
      'shadow-[0_2px_16px_rgba(0,0,0,0.06)]',
      // Hover
      hover && 'transition-all duration-200 hover:shadow-[0_8px_32px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 cursor-pointer',
      className
    )}
  >
    {children}
  </div>
);
```

### Shadow Levels
```css
/* Level 1 — Card thường */
shadow-[0_2px_16px_rgba(0,0,0,0.06)]

/* Level 2 — Card hover / active */
shadow-[0_8px_32px_rgba(99,102,241,0.12)]

/* Level 3 — Modal, Dropdown */
shadow-[0_16px_48px_rgba(0,0,0,0.14)]

/* Level 4 — Floating button, FAB */
shadow-[0_4px_24px_rgba(99,102,241,0.25)]

/* Inset shadow (cho progress bar, input) */
shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)]
```

### Card Variants
```tsx
// Stat Card — Hiển thị metric lớn
<Card className="flex flex-col gap-1">
  <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wide">
    <IconRevenue className="w-4 h-4" />
    TOTAL REVENUE
    <Badge variant="success">+15%</Badge>
  </div>
  <p className="text-3xl font-bold font-display text-gray-900">$43,871</p>
  <p className="text-xs text-gray-400">402 Orders</p>
</Card>

// Status Card — Hiển thị device / connection
<Card hover className="flex items-center gap-3">
  <StatusDot status="online" />
  <div>
    <p className="text-sm font-semibold text-gray-800">Virtual Device_2</p>
    <p className="text-xs text-gray-400">Status</p>
  </div>
  <Badge variant="online" className="ml-auto">ONLINE</Badge>
</Card>
```

---

## 5. 🔘 Button System

### Variants
```tsx
// components/ui/Button.tsx
const buttonVariants = {
  primary: cn(
    'bg-primary-500 text-white',
    'hover:bg-primary-600 active:bg-primary-700',
    'shadow-[0_4px_16px_rgba(99,102,241,0.35)]',
    'hover:shadow-[0_6px_20px_rgba(99,102,241,0.45)]',
  ),
  secondary: cn(
    'bg-gray-100 text-gray-700 border border-gray-200',
    'hover:bg-gray-200 active:bg-gray-300',
  ),
  ghost: cn(
    'bg-transparent text-gray-600',
    'hover:bg-gray-100',
  ),
  danger: cn(
    'bg-red-500 text-white',
    'hover:bg-red-600',
    'shadow-[0_4px_12px_rgba(239,68,68,0.3)]',
  ),
  outline: cn(
    'bg-white text-primary-600 border border-primary-200',
    'hover:bg-primary-50 hover:border-primary-400',
  ),
};

// Sizes
const buttonSizes = {
  sm: 'h-7 px-3 text-xs rounded-lg',
  md: 'h-9 px-4 text-sm rounded-xl',
  lg: 'h-11 px-6 text-sm rounded-xl font-semibold',
  xl: 'h-12 px-8 text-base rounded-2xl font-semibold',
};

// Base classes luôn có
const base = 'inline-flex items-center gap-2 font-medium transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-primary-500/40 active:scale-[0.97]';
```

### Icon Buttons
```tsx
// Rounded square buttons (dùng cho toolbar)
<button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm text-gray-500 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all duration-150">
  <PlusIcon className="w-4 h-4" />
</button>
```

---

## 6. 🏷️ Badge & Tag System

```tsx
const badgeVariants = {
  // Status badges
  online:  'bg-green-100 text-green-700 border border-green-200',
  offline: 'bg-gray-100 text-gray-500 border border-gray-200',
  warning: 'bg-amber-100 text-amber-700 border border-amber-200',

  // Change badges (%)
  success: 'bg-green-50 text-green-600',
  danger:  'bg-red-50 text-red-500',

  // Level badges
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard:   'bg-red-100 text-red-600',

  // Generic
  default: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary-100 text-primary-700',
};

// Dùng:
<span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', badgeVariants.online)}>
  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
  ONLINE
</span>
```

---

## 7. 📊 Charts & Data Visualization

### Area Chart (Recharts)
```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Style guidelines:
// - Stroke: primary-500 (#6366F1)
// - Fill: gradient từ primary-200 → transparent
// - Grid: dashed, màu gray-100
// - Tooltip: white card với shadow level 3
// - Dots: chỉ hiện khi hover, màu primary-500 với white border

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-100">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900">{payload[0].value}</p>
    </div>
  );
};

<ResponsiveContainer width="100%" height={200}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
      </linearGradient>
    </defs>
    <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
    <Tooltip content={<CustomTooltip />} />
    <Area
      type="monotone"
      dataKey="value"
      stroke="#6366F1"
      strokeWidth={2}
      fill="url(#colorPrimary)"
      dot={false}
      activeDot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
    />
  </AreaChart>
</ResponsiveContainer>
```

### Progress Bar
```tsx
// Gradient progress bar
<div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
  <div
    className="h-full rounded-full transition-all duration-700"
    style={{
      width: `${value}%`,
      background: 'linear-gradient(90deg, #6366F1, #818CF8)',
      boxShadow: '0 0 8px rgba(99,102,241,0.4)',
    }}
  />
</div>

// Với label
<div className="space-y-1">
  <div className="flex justify-between text-xs text-gray-400">
    <span>Low</span>
    <span className="font-semibold text-gray-700">{value}%</span>
    <span>Advanced</span>
  </div>
  <ProgressBar value={value} />
</div>
```

### Signal / Bar Chart Mini
```tsx
// 4 bars cho signal strength
const SignalBars = ({ strength }: { strength: 'weak' | 'fair' | 'good' | 'strong' }) => {
  const levels = { weak: 1, fair: 2, good: 3, strong: 4 };
  const active = levels[strength];
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{ height: `${i * 25}%` }}
          className={cn(
            'w-1 rounded-sm',
            i <= active ? 'bg-primary-500' : 'bg-gray-200'
          )}
        />
      ))}
    </div>
  );
};
```

---

## 8. 🗂️ Sidebar Navigation

### Structure
```tsx
// Layout tổng thể: icon-only sidebar + content
// Width: sidebar 64px (collapsed) hoặc 240px (expanded)

const Sidebar = () => (
  <aside className="h-screen w-16 flex flex-col items-center py-6 gap-6 bg-white border-r border-gray-100 shadow-[2px_0_16px_rgba(0,0,0,0.04)]">
    {/* Logo */}
    <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.35)]">
      <AppLogo className="w-5 h-5 text-white" />
    </div>

    <nav className="flex flex-col gap-1 flex-1">
      {navItems.map(item => (
        <SidebarItem key={item.id} {...item} />
      ))}
    </nav>

    {/* Bottom actions */}
    <div className="flex flex-col gap-2">
      <SidebarItem icon={<SettingsIcon />} label="Settings" />
    </div>
  </aside>
);

const SidebarItem = ({ icon, label, active }: NavItem) => (
  <button
    title={label}
    className={cn(
      'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 group relative',
      active
        ? 'bg-primary-500 text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]'
        : 'text-gray-400 hover:bg-primary-50 hover:text-primary-600'
    )}
  >
    {icon}
    {/* Tooltip khi hover */}
    <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
      {label}
    </span>
  </button>
);
```

---

## 9. 📅 Date Range Picker

### Design Rules (theo Image 3)
```tsx
// Layout: Sidebar preset bên trái + 2 tháng bên phải

// Container
<div className="flex bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">

  {/* Preset list — trái */}
  <div className="w-40 py-4 border-r border-gray-100">
    {presets.map(preset => (
      <button
        key={preset.id}
        className={cn(
          'w-full px-4 py-2 text-sm text-left rounded-lg mx-1 transition-all',
          selected === preset.id
            ? 'bg-primary-500 text-white font-semibold flex justify-between items-center'
            : 'text-gray-600 hover:bg-gray-50'
        )}
      >
        {preset.label}
        {selected === preset.id && <CheckIcon className="w-4 h-4" />}
      </button>
    ))}
  </div>

  {/* Calendars — phải */}
  <div className="flex-1 p-4">
    <div className="grid grid-cols-2 gap-8">
      <MonthCalendar month={currentMonth} selectedRange={range} />
      <MonthCalendar month={nextMonth} selectedRange={range} />
    </div>

    {/* Actions */}
    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Apply</Button>
    </div>
  </div>
</div>

// Day styling trong calendar:
// - Ngày thường: text-gray-700, hover: bg-primary-50 rounded-lg
// - Ngày được chọn (start/end): bg-primary-500 text-white rounded-lg
// - Ngày trong range: bg-primary-100 text-primary-700 (không rounded)
// - Ngày ngoài tháng: text-gray-300
// - Thứ header: text-xs font-semibold text-gray-400 uppercase
```

---

## 10. 🔀 Toggle Switch

```tsx
const Toggle = ({ checked, onChange }: ToggleProps) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative w-11 h-6 rounded-full transition-all duration-200',
      checked ? 'bg-primary-500' : 'bg-gray-200'
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
        checked ? 'translate-x-5.5' : 'translate-x-0.5'
      )}
    />
  </button>
);

// Với label: "On" text màu primary khi active
<div className="flex items-center gap-2">
  <Toggle checked={on} onChange={setOn} />
  {on && <span className="text-xs font-semibold text-primary-600">On</span>}
</div>
```

---

## 11. 📑 Tab Navigation

```tsx
// Underline tabs — dùng cho Overview / Network / Devices
<div className="flex gap-6 border-b border-gray-100">
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActive(tab.id)}
      className={cn(
        'pb-3 text-sm font-medium transition-all duration-150 relative',
        active === tab.id
          ? 'text-gray-900'
          : 'text-gray-400 hover:text-gray-600'
      )}
    >
      {tab.label}
      {active === tab.id && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
      )}
    </button>
  ))}
</div>

// Pill tabs — dùng cho compact filter
<div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
  {tabs.map(tab => (
    <button
      key={tab.id}
      className={cn(
        'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150',
        active === tab.id
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      )}
    >
      {tab.label}
    </button>
  ))}
</div>
```

---

## 12. 📊 Top Navigation Bar

```tsx
// App header với nav links
<header className="h-14 px-6 flex items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-40">
  {/* Logo */}
  <div className="flex items-center gap-2">
    <LogoIcon className="w-7 h-7 text-primary-500" />
    <span className="font-bold text-gray-900 font-display">AppName</span>
  </div>

  {/* Nav */}
  <nav className="flex items-center gap-1">
    {navLinks.map(link => (
      <a
        key={link.href}
        href={link.href}
        className={cn(
          'px-3 py-1.5 text-sm rounded-lg transition-all',
          link.active
            ? 'text-gray-900 font-medium'
            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
        )}
      >
        {link.label}
        {link.badge && <NotifDot />}
      </a>
    ))}
  </nav>

  {/* Actions */}
  <div className="flex items-center gap-2">
    <IconButton><SearchIcon /></IconButton>
    <IconButton><BellIcon /></IconButton>
    <Button variant="primary" size="sm">
      <PlusIcon className="w-3.5 h-3.5" />
      Create
    </Button>
    <Avatar src={user.avatar} />
  </div>
</header>
```

---

## 13. 📋 Activity Feed

```tsx
// Row trong activity feed
<div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 group">
  <Avatar src={item.user.avatar} size="sm" />
  <div className="flex-1 min-w-0">
    <p className="text-sm text-gray-700 truncate">
      <span className="font-semibold text-gray-900">{item.user.name}</span>
      {' '}{item.action}{' '}
      <span className="text-gray-900">"{item.target}"</span>
      {' for '}<span className="font-semibold">{item.amount}</span>
    </p>
    <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
  </div>
  <Badge variant={item.type}>{item.typeLabel}</Badge>
</div>
```

---

## 14. 🏗️ Layout Grid

### Page Layout
```tsx
// Desktop: Sidebar + Main content
<div className="flex h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
  <Sidebar />

  <main className="flex-1 overflow-y-auto">
    <TopBar />

    <div className="p-6 space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard />
        <StatCard />
        <StatCard />
        <StatCard />
      </div>

      {/* Chart full width */}
      <Card className="col-span-full">
        <ChartSection />
      </Card>

      {/* Two column */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ActivityFeed />
        </div>
        <div>
          <CustomerBehavior />
        </div>
      </div>
    </div>
  </main>
</div>
```

### Dashboard Grid (Network UI style)
```tsx
// Card grid với responsive
<div className="grid grid-cols-12 gap-4">
  <Card className="col-span-4">...</Card>   {/* Security */}
  <Card className="col-span-4">...</Card>   {/* Wi-Fi */}
  <Card className="col-span-4">...</Card>   {/* Devices */}
  <Card className="col-span-7">...</Card>   {/* Main device */}
  <Card className="col-span-5">...</Card>   {/* Network status */}
</div>
```

---

## 15. ✨ Animation & Micro-interactions

### Principles
```ts
// Dùng Framer Motion cho React
import { motion, AnimatePresence } from 'framer-motion';

// Stagger vào cho list items
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }
};

// Number counter animation cho stat cards
// Dùng useSpring hoặc custom hook

// Hover lift cho cards
<motion.div whileHover={{ y: -2, transition: { duration: 0.15 } }}>
  <Card>...</Card>
</motion.div>

// Progress bar fill animation
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${value}%` }}
  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
/>
```

### CSS Transitions (khi không dùng Framer)
```css
/* Tất cả interactive elements */
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Cards hover */
transition: transform 200ms ease, box-shadow 200ms ease;

/* Progress bars */
transition: width 700ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 16. 🌐 Status Indicators

```tsx
// Online dot
<span className="relative flex w-2 h-2">
  <span className="animate-ping absolute w-full h-full rounded-full bg-green-400 opacity-75" />
  <span className="relative w-2 h-2 rounded-full bg-green-500" />
</span>

// Status badge với dot
<div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', statusStyles[status])}>
  <StatusDot status={status} />
  {statusLabel[status]}
</div>

// Signal strength text
<div className="flex items-center gap-1 text-sm font-semibold text-green-600">
  <SignalIcon className="w-4 h-4" />
  Strong
</div>
```

---

## 17. 📱 Responsive Breakpoints

```ts
// tailwind.config.ts
screens: {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet
  'lg': '1024px',  // Laptop
  'xl': '1280px',  // Desktop
  '2xl': '1536px', // Wide
}

// Pattern chung:
// Mobile: Stack tất cả thành 1 cột, sidebar thành bottom nav hoặc drawer
// Tablet: 2 cột, sidebar thu nhỏ
// Desktop: Full layout như thiết kế
```

---

## 18. 🧩 Component File Structure

```
src/
├── components/
│   ├── ui/                     # Primitive components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Toggle.tsx
│   │   ├── Progress.tsx
│   │   ├── Avatar.tsx
│   │   ├── Tabs.tsx
│   │   └── Tooltip.tsx
│   ├── charts/                 # Chart components
│   │   ├── AreaChart.tsx
│   │   ├── SignalBars.tsx
│   │   └── MiniChart.tsx
│   ├── layout/                 # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── PageWrapper.tsx
│   ├── dashboard/              # Feature components
│   │   ├── StatCard.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── DeviceCard.tsx
│   │   └── NetworkCard.tsx
│   └── pickers/
│       └── DateRangePicker.tsx
├── hooks/
│   ├── useCountUp.ts           # Animated numbers
│   └── useDateRange.ts
├── lib/
│   └── cn.ts                   # clsx + tailwind-merge
└── styles/
    └── globals.css
```

---

## 19. 🛠️ Setup & Dependencies

```bash
# Core
npm install react react-dom typescript
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/react @types/react-dom

# UI utilities
npm install clsx tailwind-merge
npm install class-variance-authority    # CVA cho variants

# Icons
npm install lucide-react

# Charts
npm install recharts

# Animation
npm install framer-motion

# Date handling
npm install date-fns

# Fonts (Google Fonts — thêm vào index.html)
# Plus Jakarta Sans: https://fonts.google.com/specimen/Plus+Jakarta+Sans
# DM Sans: https://fonts.google.com/specimen/DM+Sans
# JetBrains Mono: https://fonts.google.com/specimen/JetBrains+Mono
```

```ts
// lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

---

## 20. ✅ Design Checklist

Trước khi ship bất kỳ component nào, hãy kiểm tra:

- [ ] **Shadow**: Có dùng đúng shadow level theo hierarchy?
- [ ] **Hover state**: Mọi interactive element có feedback khi hover?
- [ ] **Active/Focus**: Accessible focus ring (`ring-2 ring-primary-500/40`)?
- [ ] **Empty state**: Có hiển thị placeholder khi không có data?
- [ ] **Loading state**: Skeleton hoặc spinner cho async content?
- [ ] **Color contrast**: Text đọc được trên mọi background?
- [ ] **Spacing**: Nhất quán với Tailwind spacing scale (4px base)?
- [ ] **Typography**: Đúng size/weight hierarchy?
- [ ] **Border radius**: Nhất quán (`rounded-xl` cho card, `rounded-lg` cho button)?
- [ ] **Transition**: Mọi state change đều có `transition-all duration-150`?

---

*Cập nhật lần cuối: 2026 — Dựa trên reference UI: Network Dashboard, eCommerce Analytics Dashboard, Date Range Picker*
