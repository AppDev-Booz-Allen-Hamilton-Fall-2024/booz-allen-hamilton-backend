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
('SD'), ('TN'), ('TX'), ('UT'), ('VT'), ('VA'), ('WA'), ('WV'), ('WI'), ('WY');

-- Display table
SELECT * FROM "state";

-- Create table called policy to store information about the policy
CREATE TABLE policy(
policy_id INT primary key,
policy_name VARCHAR(50),
effective_date DATE,
expiration_date DATE,
summary VARCHAR(300),
created_when DATE,
updated_when DATE,
file_path VARCHAR(100),

-- Make fk columns
state_name VARCHAR(2),
prev_policy_id INT,
next_policy_id INT,

-- Make state_name a foreign key that points to state_name in the state table
CONSTRAINT fk_state FOREIGN KEY (state_name) REFERENCES public."state" (state_name)
);

-- Alter table to add self-referencing foreign keys
-- Make prev_policy_id and next_policy_id point to policy_id primary key in the policy table
ALTER TABLE policy
ADD CONSTRAINT fk_prev_policy_id FOREIGN KEY (prev_policy_id) REFERENCES policy (policy_id),
ADD CONSTRAINT fk_next_policy_id FOREIGN KEY (next_policy_id) REFERENCES policy (policy_id);

-- Display table
SELECT * FROM policy

-- Create table called keyword that stores all of the keywords associated
-- with a policy
CREATE TABLE keyword(
policy_id INT,
keyword VARCHAR(30),
-- create a fk for policy_id that points to policy_id of the policy table
CONSTRAINT fk_policy_id FOREIGN KEY (policy_id) REFERENCES policy (policy_id)
);

-- Display table
SELECT * FROM keyword

-- Create table called category that stores all of the categories associated
-- with a policy
CREATE TABLE category(
policy_id INT,
category VARCHAR(30),
-- create a fk for policy_id that points to policy_id of the policy table
CONSTRAINT fk_policy_id FOREIGN KEY (policy_id) REFERENCES policy (policy_id)
);

-- Display table
SELECT * FROM category
