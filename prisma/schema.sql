-- PostgreSQL Schema DDL for HR Plus+ LHSE
-- Lao Holding State Enterprise (LHSE)
-- Version 2.6 (Strictly Non-OT Compliant)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role Enums
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'HR_ADMIN', 'EXECUTIVE', 'DEPT_HEAD', 'EMPLOYEE');
CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE employment_type AS ENUM ('PERMANENT', 'PROBATION', 'CONTRACT', 'INTERN');
CREATE TYPE employee_status AS ENUM ('ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'LATE', 'EARLY_DEPARTURE', 'ABSENT', 'ON_LEAVE', 'HOLIDAY');
CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'CANCELLED');

-- 1. Branches
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_lao VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    manager_name VARCHAR(255),
    phone VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    code VARCHAR(32) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_lao VARCHAR(255) NOT NULL,
    head_employee_id UUID,
    head_name VARCHAR(255),
    budget NUMERIC(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Positions
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    title_en VARCHAR(255) NOT NULL,
    title_lao VARCHAR(255) NOT NULL,
    level VARCHAR(64) NOT NULL,
    base_salary_min NUMERIC(15, 2) NOT NULL,
    base_salary_max NUMERIC(15, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(32) UNIQUE NOT NULL,
    first_name_en VARCHAR(128) NOT NULL,
    last_name_en VARCHAR(128) NOT NULL,
    first_name_lao VARCHAR(128) NOT NULL,
    last_name_lao VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(64) NOT NULL,
    gender gender_type NOT NULL,
    date_of_birth DATE NOT NULL,
    national_id VARCHAR(64) UNIQUE NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    position_id UUID NOT NULL REFERENCES positions(id),
    reporting_to_id UUID REFERENCES employees(id),
    joining_date DATE NOT NULL,
    employment_type employment_type DEFAULT 'PERMANENT',
    status employee_status DEFAULT 'ACTIVE',
    base_salary NUMERIC(15, 2) NOT NULL,
    bank_name VARCHAR(128),
    bank_account_number VARCHAR(128),
    avatar_url TEXT,
    address TEXT,
    education TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Shifts (NO OT)
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(128) NOT NULL,
    name_lao VARCHAR(128) NOT NULL,
    start_time VARCHAR(8) NOT NULL,
    end_time VARCHAR(8) NOT NULL,
    break_start VARCHAR(8) NOT NULL,
    break_end VARCHAR(8) NOT NULL,
    color VARCHAR(16) DEFAULT '#2563eb',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Holidays
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_lao VARCHAR(255) NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Attendance Records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in VARCHAR(8),
    check_out VARCHAR(8),
    status attendance_status DEFAULT 'PRESENT',
    duration_minutes INT DEFAULT 480,
    source VARCHAR(64) DEFAULT 'BIOMETRIC_SCANNER',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- 8. Leave Types & Balances
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(128) NOT NULL,
    name_lao VARCHAR(128) NOT NULL,
    days_allowed INT NOT NULL,
    requires_document BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT TRUE,
    color VARCHAR(16) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INT NOT NULL,
    allocated INT NOT NULL,
    used INT DEFAULT 0,
    remaining INT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, leave_type_id, year)
);

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT NOT NULL,
    status approval_status DEFAULT 'PENDING',
    current_step INT DEFAULT 1,
    total_steps INT DEFAULT 2,
    assigned_approver_id UUID,
    approver_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- 9. Payroll (NO OT)
CREATE TABLE payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(32) DEFAULT 'DRAFT',
    total_gross_salary NUMERIC(15, 2) NOT NULL,
    total_social_security NUMERIC(15, 2) NOT NULL,
    total_income_tax NUMERIC(15, 2) NOT NULL,
    total_net_pay NUMERIC(15, 2) NOT NULL,
    employee_count INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    base_salary NUMERIC(15, 2) NOT NULL,
    allowances NUMERIC(15, 2) NOT NULL,
    gross_salary NUMERIC(15, 2) NOT NULL,
    social_security_employee NUMERIC(15, 2) NOT NULL,
    social_security_employer NUMERIC(15, 2) NOT NULL,
    taxable_income NUMERIC(15, 2) NOT NULL,
    personal_income_tax NUMERIC(15, 2) NOT NULL,
    other_deductions NUMERIC(15, 2) DEFAULT 0,
    net_pay NUMERIC(15, 2) NOT NULL,
    payment_status VARCHAR(32) DEFAULT 'PAID',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(payroll_period_id, employee_id)
);

-- Indexes for high-performance reporting
CREATE INDEX idx_emp_code ON employees(employee_code);
CREATE INDEX idx_emp_dept ON employees(department_id);
CREATE INDEX idx_att_date ON attendance_records(date);
CREATE INDEX idx_leave_emp ON leave_requests(employee_id);
CREATE INDEX idx_payslip_period ON payslips(payroll_period_id);
