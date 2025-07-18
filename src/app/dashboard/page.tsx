"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Calendar, CalendarDays, RefreshCw } from "lucide-react";

// Type definitions
interface AccountData {
  allAccounts: number;
  allInactiveAccounts: number;
  allUserAcccounts: number;
  allInactiveUserAccounts: number;
  allLawyerAccounts: number;
  allInactiveLawyerAccounts: number;
  allStaffAccounts: number;
  allInactiveStaffAccounts: number;
}

interface RevenueData {
  period: string;
  bookingRevenue: number;
  orderRevenue: number;
  totalRevenue: number;
}

interface AccountBreakdownItem {
  name: string;
  active: number;
  inactive: number;
  total: number;
}

interface RadialDataItem {
  name: string;
  value: number;
  fill: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RadialDataItem;
  }>;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const Dashboard: React.FC = () => {
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [yearlyRevenue, setYearlyRevenue] = useState<RevenueData[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<RevenueData[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date range states
  const [yearlyDateRange, setYearlyDateRange] = useState<DateRange>({
    startDate: "2025",
    endDate: "2025",
  });
  const [monthlyDateRange, setMonthlyDateRange] = useState<DateRange>({
    startDate: "2025-06",
    endDate: "2025-07",
  });
  const [dailyDateRange, setDailyDateRange] = useState<DateRange>({
    startDate: "2025-07-01",
    endDate: "2025-07-17",
  });

  // Mock toast function since we can't use external libraries
  const showToast = (message: string) => {
    console.error(message);
  };

  // Fetch account data
  const fetchAccountData = async (): Promise<void> => {
    try {
      const response = await fetch(
        "https://localhost:7218/api/Dashboard/account"
      );
      if (!response.ok) throw new Error("Failed to fetch account data");
      const data: AccountData = await response.json();
      setAccountData(data);
    } catch (error) {
      showToast("Failed to fetch account data");
      console.error("Account data error:", error);
    }
  };

  // Fetch yearly revenue data
  const fetchYearlyRevenue = async (
    startDate: string,
    endDate: string
  ): Promise<void> => {
    try {
      const response = await fetch(
        `https://localhost:7024/api/Dashboard/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=yearly`
      );
      if (!response.ok) throw new Error("Failed to fetch yearly revenue");
      const data: RevenueData | RevenueData[] = await response.json();
      setYearlyRevenue(Array.isArray(data) ? data : [data]);
    } catch (error) {
      showToast("Failed to fetch yearly revenue");
      console.error("Yearly revenue error:", error);
    }
  };

  // Fetch monthly revenue data
  const fetchMonthlyRevenue = async (
    startDate: string,
    endDate: string
  ): Promise<void> => {
    try {
      const response = await fetch(
        `https://localhost:7024/api/Dashboard/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=monthly`
      );
      if (!response.ok) throw new Error("Failed to fetch monthly revenue");
      const data: RevenueData | RevenueData[] = await response.json();
      setMonthlyRevenue(Array.isArray(data) ? data : [data]);
    } catch (error) {
      showToast("Failed to fetch monthly revenue");
      console.error("Monthly revenue error:", error);
    }
  };

  // Fetch daily revenue data
  const fetchDailyRevenue = async (
    startDate: string,
    endDate: string
  ): Promise<void> => {
    try {
      const response = await fetch(
        `https://localhost:7024/api/Dashboard/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=daily`
      );
      if (!response.ok) throw new Error("Failed to fetch daily revenue");
      const data: RevenueData | RevenueData[] = await response.json();
      setDailyRevenue(Array.isArray(data) ? data : [data]);
    } catch (error) {
      showToast("Failed to fetch daily revenue");
      console.error("Daily revenue error:", error);
    }
  };

  // Refresh data based on current date ranges
  const refreshData = async (): Promise<void> => {
    setLoading(true);
    await Promise.all([
      fetchAccountData(),
      fetchYearlyRevenue(yearlyDateRange.startDate, yearlyDateRange.endDate),
      fetchMonthlyRevenue(monthlyDateRange.startDate, monthlyDateRange.endDate),
      fetchDailyRevenue(dailyDateRange.startDate, dailyDateRange.endDate),
    ]);
    setLoading(false);
  };

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, []);

  // Handle date range updates
  const handleYearlyDateChange = (field: keyof DateRange, value: string) => {
    setYearlyDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleMonthlyDateChange = (field: keyof DateRange, value: string) => {
    setMonthlyDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleDailyDateChange = (field: keyof DateRange, value: string) => {
    setDailyDateRange((prev) => ({ ...prev, [field]: value }));
  };

  // Apply date range changes
  const applyDateRanges = () => {
    refreshData();
  };

  const accountChartConfig: ChartConfig = {
    active: {
      label: "Active",
      color: "#10b981", // Emerald green
    },
    inactive: {
      label: "Inactive",
      color: "#f59e0b", // Amber
    },
  };

  const revenueChartConfig: ChartConfig = {
    bookingRevenue: {
      label: "Booking Revenue",
      color: "#8b5cf6", // Purple
    },
    orderRevenue: {
      label: "Order Revenue",
      color: "#06b6d4", // Cyan
    },
    totalRevenue: {
      label: "Total Revenue",
      color: "#ef4444", // Red
    },
  };

  // Transform account data for charts
  const getAccountBreakdown = (): AccountBreakdownItem[] => {
    if (!accountData) return [];

    return [
      {
        name: "Users",
        active:
          accountData.allUserAcccounts - accountData.allInactiveUserAccounts,
        inactive: accountData.allInactiveUserAccounts,
        total: accountData.allUserAcccounts,
      },
      {
        name: "Lawyers",
        active:
          accountData.allLawyerAccounts - accountData.allInactiveLawyerAccounts,
        inactive: accountData.allInactiveLawyerAccounts,
        total: accountData.allLawyerAccounts,
      },
      {
        name: "Staff",
        active:
          accountData.allStaffAccounts - accountData.allInactiveStaffAccounts,
        inactive: accountData.allInactiveStaffAccounts,
        total: accountData.allStaffAccounts,
      },
    ];
  };

  // Get radial data for yearly revenue
  const getRadialData = (): RadialDataItem[] => {
    if (!yearlyRevenue.length) return [];

    const data = yearlyRevenue[0];
    return [
      {
        name: "Booking Revenue",
        value: data.bookingRevenue,
        fill: "#8b5cf6", // Purple
      },
      {
        name: "Order Revenue",
        value: data.orderRevenue,
        fill: "#06b6d4", // Cyan
      },
    ];
  };

  // Custom tooltip component for pie chart
  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-gray-600">
            ${data.value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  // Tick formatter for Y-axis
  const formatYAxisTicks = (value: number): string => {
    return `$${(value / 1000000).toFixed(1)}M`;
  };

  // Tick formatter for daily revenue Y-axis
  const formatDailyYAxisTicks = (value: number): string => {
    return `$${(value / 1000).toFixed(0)}K`;
  };

  // Tick formatter for X-axis dates
  const formatXAxisTicks = (value: string): string => {
    const date = new Date(value);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading dashboard data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error loading data: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of accounts and revenue analytics
          </p>
        </div>

        {/* Date Range Controls */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date Range Controls
            </CardTitle>
            <CardDescription>
              Select custom date ranges for revenue analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Yearly Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Yearly Revenue Range
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Start Year (e.g., 2024)"
                    value={yearlyDateRange.startDate}
                    onChange={(e) =>
                      handleYearlyDateChange("startDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="End Year (e.g., 2025)"
                    value={yearlyDateRange.endDate}
                    onChange={(e) =>
                      handleYearlyDateChange("endDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Monthly Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Monthly Revenue Range
                </label>
                <div className="space-y-2">
                  <input
                    type="month"
                    value={monthlyDateRange.startDate}
                    onChange={(e) =>
                      handleMonthlyDateChange("startDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="month"
                    value={monthlyDateRange.endDate}
                    onChange={(e) =>
                      handleMonthlyDateChange("endDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Daily Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Daily Revenue Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={dailyDateRange.startDate}
                    onChange={(e) =>
                      handleDailyDateChange("startDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={dailyDateRange.endDate}
                    onChange={(e) =>
                      handleDailyDateChange("endDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={applyDateRanges}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Apply Date Ranges
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Account Breakdown Chart */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Account Breakdown</CardTitle>
            <CardDescription>
              Advanced chart showing active vs inactive accounts by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={accountChartConfig}>
              <BarChart
                accessibilityLayer
                data={getAccountBreakdown()}
                margin={{
                  left: 12,
                  right: 12,
                  top: 12,
                  bottom: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar dataKey="active" fill="var(--color-active)" radius={4} />
                <Bar
                  dataKey="inactive"
                  fill="var(--color-inactive)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radial Chart - Yearly Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Yearly Revenue Distribution</CardTitle>
              <CardDescription>
                Revenue breakdown for {yearlyDateRange.startDate} -{" "}
                {yearlyDateRange.endDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueChartConfig} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={getRadialData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getRadialData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<CustomTooltip />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Line Chart - Monthly Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trends</CardTitle>
              <CardDescription>
                Monthly revenue for {monthlyDateRange.startDate} -{" "}
                {monthlyDateRange.endDate}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={revenueChartConfig}>
                <LineChart
                  accessibilityLayer
                  data={monthlyRevenue}
                  margin={{
                    left: 12,
                    right: 12,
                    top: 12,
                    bottom: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={formatYAxisTicks}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Line
                    dataKey="bookingRevenue"
                    type="monotone"
                    stroke="var(--color-bookingRevenue)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="orderRevenue"
                    type="monotone"
                    stroke="var(--color-orderRevenue)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="totalRevenue"
                    type="monotone"
                    stroke="var(--color-totalRevenue)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Area Chart - Daily Revenue */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Daily Revenue Breakdown</CardTitle>
            <CardDescription>
              Daily revenue from {dailyDateRange.startDate} to{" "}
              {dailyDateRange.endDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig}>
              <AreaChart
                accessibilityLayer
                data={dailyRevenue}
                margin={{
                  left: 12,
                  right: 12,
                  top: 12,
                  bottom: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatXAxisTicks}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatDailyYAxisTicks}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Area
                  dataKey="bookingRevenue"
                  type="natural"
                  fill="var(--color-bookingRevenue)"
                  fillOpacity={0.4}
                  stroke="var(--color-bookingRevenue)"
                  stackId="a"
                />
                <Area
                  dataKey="orderRevenue"
                  type="natural"
                  fill="var(--color-orderRevenue)"
                  fillOpacity={0.4}
                  stroke="var(--color-orderRevenue)"
                  stackId="a"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accountData?.allAccounts || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Active Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accountData
                  ? accountData.allAccounts - accountData.allInactiveAccounts
                  : 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Inactive Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accountData?.allInactiveAccounts || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue ({yearlyDateRange.startDate})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {yearlyRevenue.length
                  ? (yearlyRevenue[0].totalRevenue / 1000000).toFixed(1)
                  : 0}
                M
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
