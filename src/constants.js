const MongoDB_User_Database = "User"

const cookie_Options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',

};

export {
  MongoDB_User_Database,
  cookie_Options
}