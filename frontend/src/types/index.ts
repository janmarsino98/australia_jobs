export interface User {
    name: string;
    // Add other user properties as needed
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