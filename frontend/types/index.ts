//Enums - the fixed values my backend accepts
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

export type Status = 'APPLIED' | 'SCREENING' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

//Application Response - according to API response
export interface Application {
    id: string;
    companyName: string;
    jobType: JobType;
    location: string;
    jobRole: string;
    appliedDate: string;
    status: Status;
    statusChangedDate: string | null;
    websiteLink: string | null;
    username: string | null;
    password: string | null;
}

//Error response - backend error format
export interface ApiError {
    status: number;
    message: string;
    timestamp: string;
}

//Auth response - login endpoint
export interface AuthResponse {
    token: string;
    username: string;
}

//Login request
export interface LoginRequest {
    identifier: string;
    password: string;
}

//Register request
export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
}

// A union type matching the backend enum 
export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';

// Mirrors the backend DTO from GET /me
export interface UserProfileResponse {
    id: string;
    email: string;
    username: string;
    themePreference: ThemePreference;
}

// For PATCH /me (all fields optional since it's a partial update)
export interface UpdateProfileRequest {
    email?: string;
    username?: string;
    password?: string;
    themePreference?: ThemePreference;
}

// Mirrors MonthlyCount DTO from GET /applications/stats
export interface MonthlyCount {
    month: string;
    count: number;
}

// Mirrors ApplicationStatsResponse DTO from GET /applications/stats
export interface StatsResponse {
    totalApplications: number;
    statusBreakdown: Partial<Record<Status, number>>;
    monthlyApplications: MonthlyCount[];
    responseRate: number;
}
