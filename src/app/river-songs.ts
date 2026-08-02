import type { RiverSong } from "@/components/river-directory";

export const RIVER_PAGE_SIZE = 35;

const demoAudioBase = "https://mdn.github.io/webaudio-examples/multi-track";
const riverbedArtwork =
  "https://picsum.photos/seed/html-music-riverbed/256/256.jpg?grayscale";
const nightTransferArtwork =
  "https://picsum.photos/seed/html-music-night-transfer/256/256.jpg";
const tapeHissArtwork =
  "https://picsum.photos/seed/html-music-tape-hiss/256/256.jpg";
const sodiumLightArtwork =
  "https://picsum.photos/seed/html-music-sodium-light/256/256.jpg";
const switchboardArtwork =
  "https://picsum.photos/seed/html-music-switchboard/256/256.jpg";
const blueHourArtwork =
  "https://picsum.photos/seed/html-music-blue-hour/256/256.jpg";

const demoSources = [
  { duration: 83.252, file: "leadguitar.mp3", length: "1:23" },
  { duration: 80.3, file: "bassguitar.mp3", length: "1:20" },
  { duration: 83.252, file: "drums.mp3", length: "1:23" },
  { duration: 83.252, file: "horns.mp3", length: "1:23" },
  { duration: 83.252, file: "clav.mp3", length: "1:23" },
] as const;

const riverEntries = [
  {
    id: "riverbed",
    filename: "001_riverbed.mp3",
    artist: "andrew",
    artwork: riverbedArtwork,
    posted: "2 minutes ago",
    postedAt: "2026-08-01T13:58:00-04:00",
  },
  {
    id: "night-transfer",
    filename: "night_transfer.wav",
    artist: "unknown",
    artwork: nightTransferArtwork,
    posted: "18 minutes ago",
    postedAt: "2026-08-01T13:42:00-04:00",
  },
  {
    id: "tape-hiss",
    filename: "tape_hiss_final_final.aif",
    artist: "guest",
    artwork: tapeHissArtwork,
    posted: "yesterday",
    postedAt: "2026-07-31T03:11:00-04:00",
  },
  {
    id: "field-recording",
    filename: "field_recording_07.wav",
    artist: "anonymous",
    posted: "2 days ago",
    postedAt: "2026-07-30T21:06:00-04:00",
  },
  {
    id: "slow-upload",
    filename: "slow_upload_demo.mp3",
    artist: "html music",
    posted: "4 days ago",
    postedAt: "2026-07-28T18:27:00-04:00",
  },
  {
    id: "basement-window",
    filename: "basement_window_mix.mp3",
    artist: "mara",
    posted: "5 days ago",
    postedAt: "2026-07-27T23:14:00-04:00",
  },
  {
    id: "voicemail-3am",
    filename: "voicemail_3am.wav",
    artist: "unknown caller",
    posted: "6 days ago",
    postedAt: "2026-07-26T03:07:00-04:00",
  },
  {
    id: "bus-recording",
    filename: "untitled_bus_recording.aif",
    artist: "eli",
    posted: "1 week ago",
    postedAt: "2026-07-25T18:40:00-04:00",
  },
  {
    id: "westbound-dub",
    filename: "westbound_dub_v2.mp3",
    artist: "night transfer",
    artwork: nightTransferArtwork,
    posted: "1 week ago",
    postedAt: "2026-07-24T01:12:00-04:00",
  },
  {
    id: "kitchen-room-tone",
    filename: "room_tone_kitchen.wav",
    artist: "anonymous",
    posted: "1 week ago",
    postedAt: "2026-07-23T10:04:00-04:00",
  },
  {
    id: "blue-folder",
    filename: "blue_folder_song.mp3",
    artist: "sam",
    posted: "9 days ago",
    postedAt: "2026-07-22T20:51:00-04:00",
  },
  {
    id: "almost-finished",
    filename: "almost_finished_mix.aif",
    artist: "guest",
    posted: "10 days ago",
    postedAt: "2026-07-21T14:33:00-04:00",
  },
  {
    id: "parking-lot-rain",
    filename: "parking_lot_rain.wav",
    artist: "field unit",
    posted: "11 days ago",
    postedAt: "2026-07-20T22:18:00-04:00",
  },
  {
    id: "modem-lullaby",
    filename: "modem_lullaby.mp3",
    artist: "html music",
    posted: "12 days ago",
    postedAt: "2026-07-19T00:44:00-04:00",
  },
  {
    id: "rehearsal-take",
    filename: "rehearsal_take_04.wav",
    artist: "basement group",
    posted: "2 weeks ago",
    postedAt: "2026-07-18T19:26:00-04:00",
  },
  {
    id: "no-title",
    filename: "no_title_found.aif",
    artist: "unknown",
    artwork: tapeHissArtwork,
    posted: "2 weeks ago",
    postedAt: "2026-07-16T07:05:00-04:00",
  },
  {
    id: "afterimage",
    filename: "afterimage_demo.mp3",
    artist: "andrew",
    artwork: riverbedArtwork,
    posted: "2 weeks ago",
    postedAt: "2026-07-14T21:49:00-04:00",
  },
  {
    id: "station-id",
    filename: "station_id_old.wav",
    artist: "night transfer",
    artwork: nightTransferArtwork,
    posted: "2 weeks ago",
    postedAt: "2026-07-12T11:30:00-04:00",
  },
  {
    id: "porch-light",
    filename: "porch_light_mix.mp3",
    artist: "mara",
    posted: "3 weeks ago",
    postedAt: "2026-07-10T23:03:00-04:00",
  },
  {
    id: "last-file",
    filename: "last_file_really_final.wav",
    artist: "guest",
    posted: "3 weeks ago",
    postedAt: "2026-07-08T16:22:00-04:00",
  },
  {
    id: "laundromat-417",
    filename:
      "the_recording_from_the_room_above_the_laundromat_at_4_17_in_the_morning_take_003_revised_mix.wav",
    artist: "robin",
    posted: "3 weeks ago",
    postedAt: "2026-07-07T04:17:00-04:00",
  },
  {
    id: "signal-loss",
    filename: "signal_loss.mp3",
    artist:
      "The Extremely Long and Improvisationally Named Neighborhood Transmission Cooperative",
    posted: "4 weeks ago",
    postedAt: "2026-07-04T22:08:00-04:00",
  },
  {
    id: "exporter-failure",
    filename:
      "this_filename_has_no_spaces_and_keeps_going_because_some_exporters_do_that_when_they_render_audio_files.wav",
    artist:
      "The International Society for Extremely Long Artist Names and Late-Night Tape Exchanges",
    posted: "4 weeks ago",
    postedAt: "2026-07-03T09:51:00-04:00",
  },
  {
    id: "voice-memo-dont-erase",
    filename: "voice memo — don't erase this one FINAL (2).m4a",
    artist: "a person whose name was never written down anywhere",
    posted: "1 month ago",
    postedAt: "2026-07-01T01:36:00-04:00",
  },
  {
    id: "catalog-number-seven",
    filename:
      "0000000000000000000000000000000000000000000000000000000000000007.wav",
    artist: "archive terminal",
    posted: "1 month ago",
    postedAt: "2026-06-28T17:12:00-04:00",
  },
  {
    id: "long-collective",
    filename: "collective_test.mp3",
    artist:
      "theinternationalneighborhoodshortwaveandunlabeledcassetteexchangecollective",
    posted: "1 month ago",
    postedAt: "2026-06-25T00:03:00-04:00",
  },
  {
    id: "amp-stairwell",
    filename: "amp_in_stairwell_take_09.wav",
    artist: "room 4",
    posted: "5 weeks ago",
    postedAt: "2026-06-22T13:47:00-04:00",
  },
  {
    id: "unlabeled-minidisc",
    filename: "MINIDISC_74_TRACK_12.aif",
    artist: "unlabeled",
    posted: "5 weeks ago",
    postedAt: "2026-06-20T20:29:00-04:00",
  },
  {
    id: "north-window",
    filename: "north_window_open_very_slowly.mp3",
    artist: "weather station choir",
    posted: "6 weeks ago",
    postedAt: "2026-06-16T06:15:00-04:00",
  },
  {
    id: "archive-end",
    filename: "end_of_folder.wav",
    artist: "guest",
    posted: "6 weeks ago",
    postedAt: "2026-06-14T23:59:00-04:00",
  },
  {
    id: "payphone-chorus",
    filename: "payphone_chorus_take_2.wav",
    artist: "sodium light",
    artwork: sodiumLightArtwork,
    posted: "7 weeks ago",
    postedAt: "2026-06-12T02:14:00-04:00",
  },
  {
    id: "fluorescent-hum",
    filename: "fluorescent_hum_60hz.aif",
    artist: "building services",
    posted: "7 weeks ago",
    postedAt: "2026-06-10T19:42:00-04:00",
  },
  {
    id: "wrong-side-cassette",
    filename: "cassette_side_b_played_backwards.mp3",
    artist: "no return address",
    posted: "7 weeks ago",
    postedAt: "2026-06-08T00:31:00-04:00",
  },
  {
    id: "after-closing",
    filename: "after_closing_master.wav",
    artist: "sodium light",
    artwork: sodiumLightArtwork,
    posted: "8 weeks ago",
    postedAt: "2026-06-05T03:48:00-04:00",
  },
  {
    id: "contact-mic-bridge",
    filename: "contact_mic_under_bridge_01.wav",
    artist: "municipal listening project",
    posted: "8 weeks ago",
    postedAt: "2026-06-02T16:09:00-04:00",
  },
  {
    id: "channel-six-snow",
    filename: "channel_6_after_signoff.aif",
    artist: "sleepwalk scan",
    posted: "2 months ago",
    postedAt: "2026-05-30T01:27:00-04:00",
  },
  {
    id: "elevator-sleep",
    filename: "elevator_sleep_version_3.mp3",
    artist: "service corridor",
    posted: "2 months ago",
    postedAt: "2026-05-27T05:12:00-04:00",
  },
  {
    id: "half-speed-choir",
    filename: "choir_at_half_speed.wav",
    artist: "parish hall archive",
    posted: "2 months ago",
    postedAt: "2026-05-24T22:36:00-04:00",
  },
  {
    id: "unmarked-cdr",
    filename: "CDR_TRACK_09_UNKNOWN_DATE.aif",
    artist: "found near the loading dock",
    posted: "2 months ago",
    postedAt: "2026-05-21T14:55:00-04:00",
  },
  {
    id: "water-tower-delay",
    filename: "water_tower_delay_print.mp3",
    artist: "sodium light",
    artwork: sodiumLightArtwork,
    posted: "2 months ago",
    postedAt: "2026-05-18T20:18:00-04:00",
  },
  {
    id: "switchboard",
    filename: "switchboard_test_tones.wav",
    artist: "long distance operator",
    artwork: switchboardArtwork,
    posted: "2 months ago",
    postedAt: "2026-05-15T11:03:00-04:00",
  },
  {
    id: "borrowed-drum-machine",
    filename: "borrowed_drum_machine_do_not_delete.mp3",
    artist: "mara",
    posted: "2 months ago",
    postedAt: "2026-05-12T23:41:00-04:00",
  },
  {
    id: "sleepwalk-scan",
    filename: "sleepwalk_scan_004.aif",
    artist: "sleepwalk scan",
    posted: "3 months ago",
    postedAt: "2026-05-09T04:09:00-04:00",
  },
  {
    id: "winter-window",
    filename: "winter_window_on_portastudio.wav",
    artist: "weather station choir",
    posted: "3 months ago",
    postedAt: "2026-05-06T07:34:00-04:00",
  },
  {
    id: "answer-machine-loop",
    filename: "answering_machine_outgoing_message_loop.mp3",
    artist: "long distance operator",
    artwork: switchboardArtwork,
    posted: "3 months ago",
    postedAt: "2026-05-03T18:22:00-04:00",
  },
  {
    id: "empty-club",
    filename: "empty_club_5_43_am.wav",
    artist: "night porter",
    posted: "3 months ago",
    postedAt: "2026-04-30T05:43:00-04:00",
  },
  {
    id: "three-bells",
    filename: "three_bells_across_the_water.aif",
    artist: "field unit",
    posted: "3 months ago",
    postedAt: "2026-04-27T12:08:00-04:00",
  },
  {
    id: "fire-escape-radio",
    filename: "fire_escape_radio_mix.mp3",
    artist: "robin",
    posted: "3 months ago",
    postedAt: "2026-04-24T00:26:00-04:00",
  },
  {
    id: "low-battery",
    filename: "low_battery_warning_as_music.wav",
    artist: "archive terminal",
    posted: "3 months ago",
    postedAt: "2026-04-21T09:15:00-04:00",
  },
  {
    id: "last-train-roomtone",
    filename: "last_train_room_tone.aif",
    artist: "transit listener",
    posted: "3 months ago",
    postedAt: "2026-04-18T02:57:00-04:00",
  },
  {
    id: "receipt-paper",
    filename: "melody_written_on_receipt_paper.mp3",
    artist: "sam",
    posted: "4 months ago",
    postedAt: "2026-04-15T17:46:00-04:00",
  },
  {
    id: "blue-hour-generator",
    filename: "generator_at_blue_hour.wav",
    artist: "blue hour maintenance",
    artwork: blueHourArtwork,
    posted: "4 months ago",
    postedAt: "2026-04-12T06:02:00-04:00",
  },
  {
    id: "rooftop-antenna",
    filename: "rooftop_antenna_wind_take_6.aif",
    artist: "sleepwalk scan",
    posted: "4 months ago",
    postedAt: "2026-04-09T21:39:00-04:00",
  },
  {
    id: "hotel-ice-machine",
    filename: "hotel_ice_machine_in_b_flat.wav",
    artist: "anonymous traveler",
    posted: "4 months ago",
    postedAt: "2026-04-06T03:20:00-04:00",
  },
  {
    id: "creek-tunnel",
    filename: "creek_under_the_tunnel.mp3",
    artist: "field unit",
    posted: "4 months ago",
    postedAt: "2026-04-03T15:11:00-04:00",
  },
  {
    id: "rehearsal-door",
    filename: "rehearsal_heard_through_closed_door.wav",
    artist: "hallway microphone",
    posted: "4 months ago",
    postedAt: "2026-03-31T19:04:00-04:00",
  },
  {
    id: "four-track-dust",
    filename: "four_track_dust_mix_1999.aif",
    artist: "unlabeled",
    posted: "4 months ago",
    postedAt: "2026-03-28T08:33:00-04:00",
  },
  {
    id: "late-checkout",
    filename: "late_checkout_demo.mp3",
    artist: "blue hour maintenance",
    artwork: blueHourArtwork,
    posted: "4 months ago",
    postedAt: "2026-03-25T11:58:00-04:00",
  },
  {
    id: "dead-air-june",
    filename: "dead_air_from_last_june.wav",
    artist: "local relay",
    posted: "5 months ago",
    postedAt: "2026-03-22T00:00:00-04:00",
  },
  {
    id: "folder-bottom",
    filename: "you_have_reached_the_bottom_of_the_folder.aif",
    artist: "guest",
    posted: "5 months ago",
    postedAt: "2026-03-19T23:59:00-04:00",
  },
] as const;

export const riverSongs: RiverSong[] = riverEntries.map((entry, index) => {
  const source = demoSources[index % demoSources.length];

  return {
    ...entry,
    duration: source.duration,
    length: source.length,
    src: `${demoAudioBase}/${source.file}`,
  };
});

export function getRiverPage(cursor: string | null) {
  const cursorIndex = cursor
    ? riverSongs.findIndex((song) => song.id === cursor)
    : -1;

  if (cursor && cursorIndex === -1) return null;

  const startIndex = cursorIndex + 1;
  const songs = riverSongs.slice(startIndex, startIndex + RIVER_PAGE_SIZE);
  const lastSong = songs.at(-1);
  const hasMore = startIndex + songs.length < riverSongs.length;

  return {
    nextCursor: hasMore && lastSong ? lastSong.id : null,
    songs,
  };
}
