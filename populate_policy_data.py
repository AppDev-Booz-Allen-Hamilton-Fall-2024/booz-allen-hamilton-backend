import psycopg2
from categorize import categories
# from summarize import summary
from ner import keyword
import argparse
import json
import sys
def process_policies(policy_ids):
    conn = psycopg2.connect(
        database="adc",
        user="rohan",
        host="localhost",
        password="12345",
        port=5432
    )
    cur = conn.cursor()

    for policy_id in policy_ids:
        # Fetch the og_file_path for the given policy_id
        cur.execute("SELECT og_file_path FROM policy WHERE policy_id = %s", (policy_id,))
        result = cur.fetchone()
        print("FILEPATH: ", result)

        if result:
            print(f"Processing policy {policy_id}")
            file_path = result[0]
            if '.zip' not in file_path:
                print("RESULT: ", file_path)

                # Check if keywords already exist for this policy
                cur.execute("SELECT 1 FROM keyword WHERE policy_id = %s LIMIT 1", (policy_id,))
                keyword_exists = cur.fetchone() is not None
                print("KEYWORD: ", keyword_exists)

                # Check if categories already exist for this policy
                cur.execute("SELECT 1 FROM category WHERE policy_id = %s LIMIT 1", (policy_id,))
                category_exists = cur.fetchone() is not None
                print("CATEGORY: ", category_exists)
                if not keyword_exists and not category_exists:
                    # Generate categories and keywords
                    cats = categories(file_path)
                    print("CATEGORIES: ", cats)
                    keywords = keyword(file_path)
                    print("KEYWORDS: ", keywords)

                    # Insert keywords into the database
                    for k in keywords:
                        cur.execute(
                            "INSERT INTO keyword (policy_id, keyword) VALUES (%s, %s)",
                            (policy_id, k)
                        )

                    # Insert categories into the database
                    for c in cats:
                        cur.execute(
                            "INSERT INTO category (policy_id, category) VALUES (%s, %s)",
                            (policy_id, c)
                        )
            # n = file_path.split('/')[-1]
            # cur.execute(
            #             "INSERT INTO policy (policy_id, policy_name) VALUES (%s, %s)",
            #             (policy_id, n)
            #         )

            # Generate summary and update the policy record
            # sum_text = summary(file_path)
            # cur.execute(
            #     "UPDATE policy SET summary = %s WHERE policy_id = %s",
            #     (sum_text, policy_id)
            # )

    conn.commit()
    cur.close()
    conn.close()


parser = argparse.ArgumentParser(description='Populate policy data.')
print("SDFLSDKFJSLDKJFALKFJSAD")
parser.add_argument('policy_ids', type=str, help='JSON string of policy IDs')
args = parser.parse_args()

try:
    # Parse the JSON string into a Python list
    policy_ids = json.loads(args.policy_ids)
    if not isinstance(policy_ids, list):
        raise ValueError("policy_ids should be a list of integers.")
except (json.JSONDecodeError, ValueError) as e:
    sys.stderr.write(f"Error: {e}\n")
    sys.exit(2)

process_policies(policy_ids)
