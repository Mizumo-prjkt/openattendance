Benchmark test

|cid|name     |type   |notnull|dflt_value|pk |
|---|---------|-------|-------|----------|---|
|0  |id       |INTEGER|0      |          |1  |
|1  |col_text1|TEXT   |0      |          |0  |
|2  |col_text2|TEXT   |0      |          |0  |
|3  |col_int1 |INTEGER|0      |          |0  |
|4  |col_int2 |INTEGER|0      |          |0  |
|5  |col_real1|REAL   |0      |          |0  |
|6  |col_real2|REAL   |0      |          |0  |
|7  |col_blob1|BLOB   |0      |          |0  |
|8  |col_date1|DATE   |0      |          |0  |
|9  |col_bool1|BOOLEAN|0      |          |0  |

Admin Table
|cid|name         |type   |notnull|dflt_value|pk |
|---|-------------|-------|-------|----------|---|
|0  |admin_id     |INTEGER|0      |          |1  |
|1  |username     |TEXT   |1      |          |0  |
|2  |password     |TEXT   |1      |          |0  |
|3  |recovery_code|TEXT   |0      |          |0  |
|4  |privilege    |TEXT   |0      |'admin'   |0  |

student_id table
|cid|name                          |type   |notnull|dflt_value|pk |
|---|------------------------------|-------|-------|----------|---|
|0  |id                            |INTEGER|0      |          |1  |
|1  |last_name                     |TEXT   |0      |          |0  |
|2  |first_name                    |TEXT   |1      |          |0  |
|3  |middle_name                   |TEXT   |0      |          |0  |
|4  |phone_number                  |TEXT   |0      |          |0  |
|5  |address                       |TEXT   |0      |          |0  |
|6  |emergency_contact_name        |TEXT   |0      |          |0  |
|7  |emergency_contact_phone       |TEXT   |0      |          |0  |
|8  |emergency_contact_relationship|TEXT   |0      |          |0  |
|9  |student_id                    |TEXT   |1      |          |0  |

Configurations
|cid|name                |type   |notnull|dflt_value|pk |
|---|--------------------|-------|-------|----------|---|
|0  |config_id           |INTEGER|0      |          |1  |
|1  |school_name         |TEXT   |1      |          |0  |
|2  |school_type         |TEXT   |0      |          |0  |
|3  |address             |TEXT   |0      |          |0  |
|4  |logo_directory      |TEXT   |0      |          |0  |
|5  |organization_hotline|TEXT   |0      |          |0  |
|6  |country_code        |TEXT   |1      |          |0  |
