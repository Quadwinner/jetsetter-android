/**
 * Centralized query-key factory.
 *
 * Every cache key lives here so invalidation is consistent and typo-proof.
 * Keys are hierarchical: invalidating ['flights'] clears all flight queries,
 * while ['flights','search',params] targets one specific search.
 */
export const queryKeys = {
  flights: {
    all: ['flights'],
    search: (params) => ['flights', 'search', params],
    seatMap: (offerId) => ['flights', 'seatMap', offerId],
    fareRules: (offerId) => ['flights', 'fareRules', offerId],
    fareOptions: (offerId) => ['flights', 'fareOptions', offerId],
    pricingConfig: () => ['flights', 'pricingConfig'],
    airports: (keyword) => ['flights', 'airports', keyword],
  },
  hotels: {
    all: ['hotels'],
    search: (params) => ['hotels', 'search', params],
    destinations: () => ['hotels', 'destinations'],
  },
  cruises: {
    all: ['cruises'],
    list: () => ['cruises', 'list'],
    search: (params) => ['cruises', 'search', params],
    details: (id) => ['cruises', 'details', id],
  },
  packages: {
    all: ['packages'],
    search: (params) => ['packages', 'search', params],
    details: (id) => ['packages', 'details', id],
  },
  profile: {
    all: ['profile'],
    me: () => ['profile', 'me'],
  },
  trips: {
    all: ['trips'],
    list: () => ['trips', 'list'],
  },
  requests: {
    all: ['requests'],
    list: () => ['requests', 'list'],
    detail: (id) => ['requests', 'detail', id],
  },
  quotes: {
    all: ['quotes'],
    list: () => ['quotes', 'list'],
    detail: (id) => ['quotes', 'detail', id],
  },
  currency: {
    rates: () => ['currency', 'rates'],
  },
};
