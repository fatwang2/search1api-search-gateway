/**
 * API configuration
 */
export const config = {
  // API endpoints with primary and backup options
  endpoints: {
    search: {
      // Primary and backup endpoints in priority order
      urls: [
        'https://searxngmain.search1api.com/search',
        'https://searxngbackup.search1api.com/search',
        'https://search.search1api.com/search',
      ]
    },
    // Add more API services here as needed
  },
  
  // Default timeout in milliseconds
  defaultTimeout: 10000,
  
  // Cache configuration
  cache: {
    defaultTtl: 60 * 1000,  // 1 minute
  },
  
  // Search aggregation configuration
  search: {
    maxPages: 5,        // Maximum pages to fetch when aggregating results
    defaultLimit: 10,   // Default number of results to return
  },
}
