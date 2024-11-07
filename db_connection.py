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

# Store file path
lst = scraper("https://www.pacodeandbulletin.gov/Display/pacode?titleNumber=055&file=/secure/pacode/data/055/055toc.html&searchunitkeywords=&operator=OR&title=null", "https://www.pacodeandbulletin.gov")

# Go through every file_path in the lst
for file_path in lst:
    # Check for duplicates by counting existing records with the same file_path
    cur.execute("SELECT policy_id FROM policy WHERE og_file_path = %s", (file_path,))
    result = cur.fetchone()
    
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
            
        # Loop through array of keywords
        for k in keywords:
            # Insert keyword
            cur.execute("INSERT INTO keyword (policy_id, keyword) VALUES (%s, %s)", (policy_id, k))
        # Insert categories\
        for c in cats:
            # Insert category
            cur.execute("INSERT INTO category (policy_id, category) VALUES (%s, %s)", (policy_id, c))
        
        # Sum stores a big string
        sum = summary(file_path)
        cur.execute("UPDATE policy SET summary = %s WHERE policy_id = %s", (sum, policy_id))

# Make the changes to the database persistent
conn.commit()

# Close cursor and communication with the database
cur.close()
conn.close()
