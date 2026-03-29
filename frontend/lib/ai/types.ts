import { JobType } from '@/types';

export interface ExtractJobPostingOutput {
    companyName: string | null;
    jobRole: string | null;
    location: string | null;
    jobType: JobType | null;
    websiteLink: string | null;
}
