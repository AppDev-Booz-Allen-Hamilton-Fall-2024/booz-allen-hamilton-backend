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
count = 1
for filename in lst:
    # Add filename to database inside ***
    # Make cur.execute if statement to make sure that duplicates aren't added ***

    #sum = summary(filename)
    #cats = categories(filename)
    #keywords = keyword(filename)

    # Add sum, categories, and keywords ****

    # Add file
     # Check for duplicates
    cur.execute("SELECT COUNT(*) FROM policy WHERE policy_name = %s", (filename,))
    if cur.fetchone()[0] == 0:
        cur.execute("INSERT INTO policy (policy_id, policy_name) VALUES (%s, %s)", (count, filename))
        count += 1

    # instead of using count to number the policy_id, use the SQL method (indexing) that
    # automatically adds 

# Make the changes to the database persistent
conn.commit()

# Close cursor and communication with the database
cur.close()
conn.close()
