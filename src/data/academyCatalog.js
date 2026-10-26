export const ACADEMY_LOCATIONS = [
  {
    id: 'NEWCASTLE',
    name: 'Newcastle',
    mode: 'in-person',
    day: 'Saturday',
    time: '1:00 – 3:30 PM',
    venue: 'St. Aidans Community Centre, Gosforth',
    address: 'Princes Rd, Newcastle upon Tyne, NE3 5TT',
  },
  {
    id: 'DURHAM',
    name: 'Durham',
    mode: 'in-person',
    day: 'Sunday',
    time: '8:30 AM – 11:00 AM',
    venue: 'Framwellgate Moor Community Centre',
    address: 'Front St, Durham DH1 5BL',
  },
  {
    id: 'MIDDLESBROUGH',
    name: 'Middlesbrough',
    mode: 'in-person',
    day: 'Sunday',
    time: '5:00 – 6:00 PM',
    venue: 'Hindu Temple',
    address: '54 Westbourne Grove, North Ormesby, Middlesbrough TS3 6EF',
  },
  {
    id: 'ONLINE',
    name: 'Online',
    mode: 'online',
    day: 'By arrangement',
    time: 'Contact us for availability',
    venue: 'Online class',
    address: '',
  },
]

export const ACADEMY_COURSES = [
  {
    id: 'COURSE-CARNATIC-VOCAL',
    name: 'Carnatic Vocal Music',
  },
]

export const locationById = Object.fromEntries(
  ACADEMY_LOCATIONS.map((location) => [location.id, location])
)

export const courseById = Object.fromEntries(
  ACADEMY_COURSES.map((course) => [course.id, course])
)
