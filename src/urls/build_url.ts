import { JobParams } from "../types/urlparams";

export function buildAmazonJobsUrl(options: JobParams) {
    const baseUrl = "https://www.amazon.jobs/en/search";
    const params = new URLSearchParams();

    if (options.offset !== undefined) {
        params.set("offset", options.offset.toString());
    }
    if (options.result_limit !== undefined) {
        params.set("result_limit", options.result_limit.toString());
    }
    if (options.sort) {
        params.set("sort", options.sort);
    }
    if (options.country) {
        params.append("country[]", options.country); // must use append for array-style param
    }
    if (options.distanceType) {
        params.set("distanceType", options.distanceType);
    }
    if (options.radius) {
        params.set("radius", options.radius);
    }
    if (options.industry_experience) {
        params.set("industry_experience", options.industry_experience);
    }
    if (options.base_query) {
        params.set("base_query", options.base_query);
    }

    return `${baseUrl}?${params.toString()}`;
}
