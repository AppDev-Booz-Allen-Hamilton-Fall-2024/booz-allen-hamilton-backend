# This file establishes a connection for the PostgreSQL database

# Import package, on terminal: pip3 install psycopg2-binary
import psycopg2
# returns a string
from categorize import categories
# returns a LARGE string
from summarize import summary
# returns a list
from ner import keyword
from scraping import scraper

# conn stores the connection to the local database
conn = psycopg2.connect(database = "adc", 
                        user = "buenosnachos", 
                        host= 'localhost',
                        password = "12345",
                        port = 5432)

# Open a cursor to perform database operations
cur = conn.cursor()

# Write code here (use cur.execute() to execute SQL commands)

# There are three funcitons that occur when a file is uploaded:
# 1) Summarize
# 2) Key Word Extraction (ner)
# 3) Category
# We need to store the result of these functions for every uploaded file in the database
# To do this, we need to import file

# File paths first
# Upload and Web Scraped 
# , and then
# When summarize function is called, and the summary is generated, we want to store it
# in the summarize column
# Another file called key word extraction and we will have to put in the pdf intiot here
# to get the keywords, whihc come as a list
# Another file called catgeories which will give u chip , etx. which comes in a string

# Make the changes to the database persistent
conn.commit()

# Close cursor and communication with the database
cur.close()
conn.close()
