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

# If it already exists, dont add it

# Store file path
lst = scraper("https://www.pacodeandbulletin.gov/Display/pacode?titleNumber=055&file=/secure/pacode/data/055/055toc.html&searchunitkeywords=&operator=OR&title=null", "https://www.pacodeandbulletin.gov")

# Go through every file_path in the lst
for file_path in lst:
    # Check for duplicates by counting existing records with the same file_path
    cur.execute("SELECT policy_id FROM policy WHERE og_file_path = %s", (file_path,))
    result = cur.fetchone()
    remove_this = 1
    
    if result:
        # If the file_path exists, get the existing policy_id
        policy_id = result[0]
    else:
        # If the file_path does not exist, insert it and retrieve the new policy_id
        cur.execute("INSERT INTO policy (og_file_path) VALUES (%s) RETURNING policy_id", (file_path,))
        policy_id = cur.fetchone()[0]

        # Cats and keywords stores an array
        cats = categories(file_path) 
        keywords = keyword(file_path) 

        # Sum stores a big string
        sum = summary(file_path)
            
        # Loop through array of keywords
        for k in keywords:
            # Insert keyword
            cur.execute("INSERT INTO keyword (policy_id, keyword) VALUES (%s, %s)", (policy_id, k))
        # Insert categories
        for c in cats:
            # Insert category
            cur.execute("INSERT INTO category (policy_id, category) VALUES (%s, %s)", (policy_id, c))
        if remove_this == 1:
            cur.execute("INSERT INTO policy (policy_id, summary) VALUES (%s, %s)", (policy_id, sum))
            remove_this = remove_this + 1

# Make the changes to the database persistent
conn.commit()

# Close cursor and communication with the database
cur.close()
conn.close()
