# ------------------------------------------------------------
# DATABASE CONFIGURATION (MFA ENABLED)
# ------------------------------------------------------------

# The consistent part of your 29 server addresses
SERVER_SUFFIX = "-sql.database.windows.net"
DB_NAME = "cama_model"
DB_USER = "jhyde@utah.gov" # Your Entrata/AD email

# Mapping County names to their specific server prefixes
# Add all 29 counties to this dictionary
COUNTY_SERVERS = {
    "duchesne": "duchesne",
    "sevier": "sevier",
    "Uintah": "uintah",
    "toolel": "davis",
    "morgan": "morgan"
}

