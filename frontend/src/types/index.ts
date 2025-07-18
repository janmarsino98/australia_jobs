export interface User {
    id?: string;
    _id?: string;
    name: string;
    email?: string;
    role?: string;
    email_verified?: boolean;
    profile?: {
        first_name?: string;
        last_name?: string;
        display_name?: string;
        profile_picture?: string;
        bio?: string;
        phone?: string;
        location?: string;
        website?: string;
        linkedin_profile?: string;
    };
    oauth_accounts?: {
        [provider: string]: {
            connected_at?: string;
            last_used?: string;
            provider_id?: string;
        };
    };
    created_at?: string;
    last_login?: string;
    is_active?: boolean;
}

export interface JobCard {
    title: string;
    imgSrc: string;
    minSalary: number;
    maxSalary: number;
}

export interface Job {
    _id: string;
    jobtype: string;
    avatar: string;
    remuneration_period: string;
}

export interface City {
    city: string;
    state: string;
}

export interface State {
    state: string;
}

export interface JobType {
    jobtype: string;
} 