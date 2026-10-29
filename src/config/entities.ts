/**
 * Every Home Assistant entity the dashboard uses, by what it is, grouped per
 * room. The config and the code refer to these instead of the raw IDs.
 */
export enum Entity {
  // People
  PERSON_JEROEN = 'person.jeroen',
  PERSON_ELINE = 'person.eline',

  // Living
  LIVING_FLOOR_LAMP = 'light.living_switch_dining_table',
  LIVING_CUPBOARD_LIGHTS = 'light.huecupboard',
  LIVING_CUPBOARD_LIGHT_LEFT = 'light.0x001788010efb449a',
  LIVING_CUPBOARD_LIGHT_RIGHT = 'light.0x001788010efb4490',
  LIVING_FRONT_DOOR_CONTACT = 'binary_sensor.0x001788011004451e_contact',
  LIVING_SLIDING_WINDOW_CONTACT = 'binary_sensor.0x001788011004452e_contact',
  LIVING_SCREENS_ALL = 'cover.screens',
  LIVING_SCREEN_LEFT_FRONT = 'cover.rts_16774497',
  LIVING_SCREEN_LEFT_FRONT_MY_POSITION = 'button.rts_16774497_my_position',
  LIVING_SCREEN_RIGHT_FRONT = 'cover.rts_16740619',
  LIVING_SCREEN_RIGHT_FRONT_MY_POSITION = 'button.rts_16740619_my_position',
  LIVING_SCREEN_SIDE = 'cover.rts_16750040',
  LIVING_SCREEN_SIDE_MY_POSITION = 'button.rts_16750040_my_position',
  LIVING_SONOS = 'media_player.living_room',
  LIVING_CHROMECAST = 'media_player.living_living',
  LIVING_MOOD_LIGHTING_SCENE = 'scene.living_mood_lighting',

  // Kitchen, back door, lights without a room
  KITCHEN_SLIDING_WINDOW_CONTACT = 'binary_sensor.0x00178801100445ff_contact',
  BACK_DOOR_CONTACT = 'binary_sensor.0x0017880110044edb_contact',
  BACK_DOOR_CAMERA = 'camera.back_door_fluent_lens_0',
  PATHWAY_CAMERA = 'camera.right_pathway_fluent_lens_0',
  CENTRIS_LIGHT = 'light.centris',

  // Master bedroom
  MASTER_BEDROOM_AIRCO = 'climate.master_bedroom_airco',
  MASTER_BEDROOM_TEMPERATURE = 'sensor.master_bedroom_airco_room_temperature',
  MASTER_BEDROOM_ROLLER_SHUTTER = 'cover.rts_16727506',
  MASTER_BEDROOM_ROLLER_SHUTTER_MY_POSITION = 'button.rts_16727506_my_position',
  MASTER_BEDROOM_SMOKE_DETECTOR = 'binary_sensor.0x0015bc003106379c_smoke',
  MASTER_BEDROOM_SMOKE_DETECTOR_BATTERY = 'sensor.0x0015bc003106379c_battery',

  // Marielou
  MARIELOU_HERSTAL_LIGHT = 'light.bedroom_marielou_herstal_light_switch',
  MARIELOU_AIRCO = 'climate.bedroom_marielou_airco',
  MARIELOU_TEMPERATURE = 'sensor.0xf044d3fffecd20d8_temperature',
  MARIELOU_HUMIDITY = 'sensor.0xf044d3fffecd20d8_humidity',
  MARIELOU_ROLLER_SHUTTER = 'cover.rts_16767817',
  MARIELOU_ROLLER_SHUTTER_MY_POSITION = 'button.rts_16767817_my_position',
  PRE_SLEEP_SCENE = 'scene.pre_sleep',

  // Garage
  GARAGE_DOOR_STATE = 'sensor.garage_door_state_classification',
  GARAGE_DOOR_IMPULSE_SCRIPT = 'script.garage_door_impuls',
  GARAGE_DOOR_CAMERA = 'camera.living_clear',
  GARAGE_STORAGE_LIGHT = 'light.storage_switch',
  GARAGE_SMOKE_DETECTOR = 'binary_sensor.0x0015bc003106405f_smoke',
  GARAGE_SMOKE_DETECTOR_BATTERY = 'sensor.0x0015bc003106405f_battery',

  // Bureau
  BUREAU_CEILING_LIGHT = 'light.ceiling_light',
  BUREAU_CEILING_LIGHT_RING = 'light.0x54ef4410012089f2_rgb',
  BUREAU_CEILING_LIGHT_LAMP = 'light.0x54ef4410012089f2_white',
  BUREAU_TEMPERATURE = 'sensor.0x7c3e822f69dd0000_temperature',
  BUREAU_HUMIDITY = 'sensor.0x7c3e822f69dd0000_humidity',
  BUREAU_ROLLER_SHUTTER = 'cover.rts_16765494',
  BUREAU_ROLLER_SHUTTER_MY_POSITION = 'button.rts_16765494_my_position',
  BUREAU_SMOKE_DETECTOR = 'binary_sensor.0x0015bc003106406b_smoke',
  BUREAU_SMOKE_DETECTOR_BATTERY = 'sensor.0x0015bc003106406b_battery',

  // Guest room
  GUEST_ROOM_AIRCO = 'climate.guest_room_airco',
  GUEST_ROOM_ROLLER_SHUTTER = 'cover.rts_16722417',
  GUEST_ROOM_ROLLER_SHUTTER_MY_POSITION = 'button.rts_16722417_my_position',
  GUEST_ROOM_SMOKE_DETECTOR = 'binary_sensor.0x0015bc003106405c_smoke',
  GUEST_ROOM_SMOKE_DETECTOR_BATTERY = 'sensor.0x0015bc003106405c_battery',

  // Bathroom
  BATHROOM_VELUX = 'cover.velux',
  BATHROOM_VELUX_MY_POSITION = 'button.velux_my_position',

  // Garden: Jaqueline, the lawn mower (Worx Landroid)
  GARDEN_LAWN_MOWER = 'lawn_mower.jeroen_dg2_gmail_com_jaqueline',
  GARDEN_LAWN_MOWER_ZONE = 'select.jeroen_dg2_gmail_com_jaqueline_zone',
  GARDEN_LAWN_MOWER_BATTERY = 'sensor.jeroen_dg2_gmail_com_jaqueline_battery',
  GARDEN_LAWN_MOWER_BATTERY_TEMPERATURE = 'sensor.jeroen_dg2_gmail_com_jaqueline_battery_temperature',
  GARDEN_LAWN_MOWER_CHARGING = 'binary_sensor.jeroen_dg2_gmail_com_jaqueline_charging',
  GARDEN_LAWN_MOWER_RAIN_SENSOR = 'binary_sensor.jeroen_dg2_gmail_com_jaqueline_rain_sensor',
  GARDEN_LAWN_MOWER_CONNECTION = 'binary_sensor.jeroen_dg2_gmail_com_jaqueline_mqtt',
  GARDEN_LAWN_MOWER_ERROR = 'sensor.jeroen_dg2_gmail_com_jaqueline_error',
  GARDEN_LAWN_MOWER_BLADE_HOURS_SINCE_RESET = 'sensor.jeroen_dg2_gmail_com_jaqueline_blade_runtime_since_reset',
  GARDEN_LAWN_MOWER_DISTANCE_TOTAL = 'sensor.jeroen_dg2_gmail_com_jaqueline_distance_driven_total',

  // Energy and water
  ELECTRICITY_POWER = 'sensor.p1_meter_power',
  ELECTRICITY_CONSUMPTION_TODAY = 'sensor.p1_meter_energy_consumption_daily',
  ELECTRICITY_PRODUCTION_TODAY = 'sensor.p1_meter_energy_production_daily',
  GAS_CONSUMPTION_TODAY = 'sensor.gas_meter_consumption_daily',
  WATER_CONSUMPTION_TODAY = 'sensor.garage_water_meter_consumption_daily',

  // Radio stations
  PLAY_RADIO_1_ON_CHROMECAST_SCRIPT = 'script.speel_radio1_op_chromecast',
  PLAY_STUDIO_BRUSSEL_ON_CHROMECAST_SCRIPT = 'script.speel_studiobrussel_op_chromecast',
  PLAY_TIJDLOZE_ON_SONOS_SCRIPT = 'script.speel_tijdloze_op_sonos',

  // Devices and updates
  JEROENS_IPAD_BATTERY_LEVEL = 'sensor.jeroens_ipad_battery_level',
  JEROENS_IPAD_BATTERY_STATE = 'sensor.jeroens_ipad_battery_state',
  JEROENS_IPHONE_BATTERY_LEVEL = 'sensor.iphone_16_pro_battery_level',
  JEROENS_IPHONE_BATTERY_STATE = 'sensor.iphone_16_pro_battery_state',
  IMMICH_UPDATE = 'update.irpi_admin_version',
  PAPERLESS_UPDATE = 'update.garage_paperless_software',

  // Babysitter, catsitter and commute
  BABYSITTER_NEEDED_LIST = 'todo.babysitter_needed',
  SCAN_CALENDAR_FOR_BABYSITTER_AUTOMATION = 'automation.scan_google_calendar_for_babysit_requirements',
  CARA_CATSITTER_NEEDED_LIST = 'todo.catsitter_needed',
  SCAN_CALENDAR_FOR_CATSITTER_AUTOMATION = 'automation.scan_google_calendar_for_catsit_requirements',
  JEROEN_TRAVEL_TIME_HOME = 'sensor.commuting_home_travel_time_jeroen',

  // Today's birthdays, filled each night by an HA automation from calendar.birthdays
  BIRTHDAYS_TODAY_LIST = 'todo.birthdays_today',

  // Cara's water fountain: the pump runs for a while every 15 minutes
  CARA_WATER_FOUNTAIN = 'switch.0x94a081fffe562fad',
}
