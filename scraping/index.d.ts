export interface DineOutApiResult {
  docs: Docs;
}

export interface Docs {
  count: number;
  docs: Restaurant[];
}

export interface Restaurant {
  crmtracking: Crmtracking;
  categories: Category[];
  detailURL: string;
  loc?: Loc;
  latitude?: number;
  longitude?: number;
  description: string;
  primary_category: PrimaryCategory;
  primary_site: string;
  primary_image_url: string;
  rankorder: number;
  recid: number;
  title: string;
  qualityScore: number;
  amenities: Amenities;
}

export interface Crmtracking {
  core_listing_click: string;
  core_twitter_click: string;
  core_facebook_click: string;
}

export interface Category {
  primary: boolean;
  subcatid: number;
  subcatname: string;
  catname: string;
  catid: number;
}

export interface Loc {
  type: string;
  coordinates: number[];
}

export interface PrimaryCategory {
  catname: string;
  subcatname: string;
}

export interface Amenities {
  dineout_dinnermenuprice: DineoutDinnermenuprice;
  dineout_cuisinetype: DineoutCuisinetype;
  dineout_neighborhood: DineoutNeighborhood;
  dineout_glutenfreeoptions?: DineoutGlutenfreeoptions;
  dineout_veggieoptions?: DineoutVeggieoptions;
  dineout_reservationstatus: DineoutReservationstatus;
  dineouttogo_reservation?: DineouttogoReservation;
  dineout_enablemenu: DineoutEnablemenu;
  dineoutbreakfastmenu_enablemenu?: DineoutbreakfastmenuEnablemenu;
  dineouttogo_enablemenu?: DineouttogoEnablemenu;
  dineoutlunchmenu_reservationstatus?: DineoutlunchmenuReservationstatus;
  dineoutlunchmenu_enablemenu?: DineoutlunchmenuEnablemenu;
  dineoutbreakfastbrunchmenu_reservationstatus?: DineoutbreakfastbrunchmenuReservationstatus;
  dineoutbreakfastbrunchmenu_enablemenu?: DineoutbreakfastbrunchmenuEnablemenu;
}

export interface DineoutDinnermenuprice {
  listid: number;
}

export interface DineoutCuisinetype {
  listid: number;
}

export interface DineoutNeighborhood {
  listid: number;
}

export interface DineoutGlutenfreeoptions {
  value_raw: boolean;
}

export interface DineoutVeggieoptions {
  value_raw: boolean;
}

export interface DineoutReservationstatus {
  value: string;
}

export interface DineouttogoReservation {
  value: string;
}

export interface DineoutEnablemenu {
  tabshortname: string;
  amenitytabid: number;
  value: string;
  label: string;
  shortname: string;
  amenitygroupid: number;
  digits: number;
  fieldid: number;
  typeid: number;
  type: string;
  value_raw: boolean;
  value_string: string;
  uniquename: string;
}

export interface DineoutbreakfastmenuEnablemenu {
  tabshortname: string;
  amenitytabid: number;
  value: string;
  label: string;
  shortname: string;
  amenitygroupid: number;
  digits: number;
  fieldid: number;
  typeid: number;
  type: string;
  value_raw: boolean;
  value_string: string;
  uniquename: string;
}

export interface DineouttogoEnablemenu {
  tabshortname: string;
  amenitytabid: number;
  value: string;
  label: string;
  shortname: string;
  amenitygroupid: number;
  digits: number;
  fieldid: number;
  typeid: number;
  type: string;
  value_raw: boolean;
  value_string: string;
  uniquename: string;
}

export interface DineoutlunchmenuReservationstatus {
  listid: number;
  tabshortname: string;
  amenitytabid: number;
  value: string;
  label: string;
  shortname: string;
  amenitygroupid: number;
  digits: number;
  fieldid: number;
  typeid: number;
  type: string;
  value_raw: ValueRaw;
  value_string: string;
  uniquename: string;
}

export interface ValueRaw {
  listid: number;
  value: string;
}

export interface DineoutlunchmenuEnablemenu {
  tabshortname: string;
  amenitytabid: number;
  value: string;
  label: string;
  shortname: string;
  amenitygroupid: number;
  digits: number;
  fieldid: number;
  typeid: number;
  type: string;
  value_raw: boolean;
  value_string: string;
  uniquename: string;
}

export interface DineoutbreakfastbrunchmenuReservationstatus {
  listid: number;
  tabshortname: string;
  amenitytabid: number;
  value: string;
  label: string;
  shortname: string;
  amenitygroupid: number;
  digits: number;
  fieldid: number;
  typeid: number;
  type: string;
  value_raw: ValueRaw2;
  value_string: string;
  uniquename: string;
}

export interface ValueRaw2 {
  listid: number;
  value: string;
}

export interface DineoutbreakfastbrunchmenuEnablemenu {
  tabshortname: string;
  amenitytabid: number;
  value: string;
  label: string;
  shortname: string;
  amenitygroupid: number;
  digits: number;
  fieldid: number;
  typeid: number;
  type: string;
  value_raw: boolean;
  value_string: string;
  uniquename: string;
}
