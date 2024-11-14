import psycopg2
from categorize import categories
from summarize import summary
from ner import keyword

def process_policies(policy_ids):
    conn = psycopg2.connect(
        database="adc",
        user="postgres",
        host="localhost",
        password="12345",
        port=5432
    )
    cur = conn.cursor()

    for policy_id in policy_ids:
        cur.execute("SELECT og_file_path FROM policy WHERE policy_id = %s", (policy_id,))
        result = cur.fetchone()

        if result:
            file_path = result[0]

            cur.execute("SELECT 1 FROM keyword WHERE policy_id = %s LIMIT 1", (policy_id,))
            keyword_exists = cur.fetchone() is not None

            cur.execute("SELECT 1 FROM category WHERE policy_id = %s LIMIT 1", (policy_id,))
            category_exists = cur.fetchone() is not None

            if not keyword_exists and not category_exists:
                cats = categories(file_path)
                keywords = keyword(file_path)

                for k in keywords:
                    cur.execute("INSERT INTO keyword (policy_id, keyword) VALUES (%s, %s)", (policy_id, k))
                
                for c in cats:
                    cur.execute("INSERT INTO category (policy_id, category) VALUES (%s, %s)", (policy_id, c))

            sum = summary(file_path)
            cur.execute("UPDATE policy SET summary = %s WHERE policy_id = %s", (sum, policy_id))

    conn.commit()

    cur.close()
    conn.close()
