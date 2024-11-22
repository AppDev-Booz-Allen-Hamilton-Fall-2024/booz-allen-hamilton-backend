-- Create table "state" that lists all of the states and has each state as a 
-- private key
CREATE TABLE "state"(
state_name VARCHAR(2) primary key
);

-- Insert 50 states into the state_name column
INSERT INTO "state"(state_name) 
VALUES ('AL'), ('AK'), ('AZ'), ('AR'), ('CA'), ('CO'), ('CT'), ('DE'), ('FL'), ('GA'),
('HI'), ('ID'), ('IL'), ('IN'), ('IA'), ('KS'), ('KY'), ('LA'), ('ME'), ('MD'),
('MA'), ('MI'), ('MN'), ('MS'), ('MO'), ('MT'), ('NE'), ('NV'), ('NH'), ('NJ'),
('NM'), ('NY'), ('NC'), ('ND'), ('OH'), ('OK'), ('OR'), ('PA'), ('RI'), ('SC'),
('SD'), ('TN'), ('TX'), ('UT'), ('VT'), ('VA'), ('WA'), ('WV'), ('WI'), ('WY'), ('DC');

-- Display table
SELECT * FROM "state";

-- Create table called policy to store information about the policy
CREATE TABLE policy(
-- policy_id is automatically generated when a new policy is added
policy_id SERIAL primary key,
policy_name VARCHAR(100),
nickname VARCHAR(100),
effective_date DATE,
expiration_date DATE,
summary VARCHAR(8000),
created_when DATE,
updated_when DATE,
og_file_path VARCHAR(250),
annotated_file_path VARCHAR(260),

-- Make fk columns
state_name VARCHAR(2),

-- Make state_name a foreign key that points to state_name in the state table
CONSTRAINT fk_state FOREIGN KEY (state_name) REFERENCES public."state" (state_name),

parent_policy_id INT,
CONSTRAINT fk_parent_policy FOREIGN KEY (parent_policy_id) REFERENCES policy (policy_id)

);

-- Index to optimize queries on parent_policy_id
CREATE INDEX idx_parent_policy_id ON policy (parent_policy_id);

-- Alter table to add self-referencing foreign keys
-- Make prev_policy_id and next_policy_id point to policy_id primary key in the policy table


-- Display table
SELECT * FROM policy;

-- Create table called keyword that stores all of the keywords associated
-- with a policy
CREATE TABLE keyword(
policy_id INT,
keyword VARCHAR(100),
-- create a fk for policy_id that points to policy_id of the policy table
CONSTRAINT fk_policy_id FOREIGN KEY (policy_id) REFERENCES policy (policy_id)
);

-- Display table
SELECT * FROM keyword;

-- Create table called category that stores all of the categories associated
-- with a policy
CREATE TABLE category(
policy_id INT,
category VARCHAR(30),
-- create a fk for policy_id that points to policy_id of the policy table
CONSTRAINT fk_policy_id FOREIGN KEY (policy_id) REFERENCES policy (policy_id)
);

-- Display table
SELECT * FROM category;

-- Create table called program that stores all of the programs associated
-- with a policy
CREATE TABLE program(
policy_id INT,
program VARCHAR(30),
-- create a fk for policy_id that points to policy_id of the policy table
CONSTRAINT fk_policy_id FOREIGN KEY (policy_id) REFERENCES policy (policy_id)
);

-- Display table
SELECT * FROM program;

CREATE TABLE summary_diff(
    policy_id_1 INT,          -- policy_id of the first policy
    policy_id_2 INT,          -- policy_id of the second policy
    summary_difference TEXT,  -- stores the difference between summaries (could be a text field or another appropriate type)
    created_when DATE,        -- date when the summary difference was created
    
    -- Make foreign keys to refer to the policy table
    CONSTRAINT fk_policy_1 FOREIGN KEY (policy_id_1) REFERENCES policy (policy_id),
    CONSTRAINT fk_policy_2 FOREIGN KEY (policy_id_2) REFERENCES policy (policy_id),
    
    -- Ensure there is only one difference record for each unique pair of policies
    CONSTRAINT unique_policy_pair UNIQUE (policy_id_1, policy_id_2)
);
