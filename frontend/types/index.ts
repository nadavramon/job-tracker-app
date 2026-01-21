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
