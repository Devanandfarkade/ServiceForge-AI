"""
ServiceForge AI — Pytest Global Test Configuration & Module Import Loader

Exposes all production Lambda handler modules under `functions.<name>.handler` to Python's
import system during pytest execution without modifying production folder names,
SAM CloudFormation templates, or Lambda code.
"""

import os
import sys
import importlib.util
from types import ModuleType

# 1. Ensure Backend root directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

functions_dir = os.path.join(backend_dir, 'functions')

# 2. Ensure root 'functions' package module exists in sys.modules with proper __path__
if "functions" not in sys.modules:
    functions_mod = ModuleType("functions")
    functions_mod.__path__ = [functions_dir]
    sys.modules["functions"] = functions_mod
else:
    if not hasattr(sys.modules["functions"], "__path__") or not sys.modules["functions"].__path__:
        sys.modules["functions"].__path__ = [functions_dir]

def register_lambda_module(alias_name: str, rel_file_path: str):
    full_path = os.path.normpath(os.path.join(backend_dir, rel_file_path))
    if not os.path.exists(full_path):
        return

    parts = alias_name.split('.')
    # Ensure all parent modules/packages exist in sys.modules with valid __path__
    for i in range(1, len(parts)):
        pkg_alias = ".".join(parts[:i])
        sub_folder = parts[i-1]
        target_dir = functions_dir if i == 1 else os.path.join(functions_dir, sub_folder)

        if pkg_alias not in sys.modules:
            mod = ModuleType(pkg_alias)
            mod.__path__ = [target_dir]
            sys.modules[pkg_alias] = mod
        elif not hasattr(sys.modules[pkg_alias], "__path__") or not sys.modules[pkg_alias].__path__:
            sys.modules[pkg_alias].__path__ = [target_dir]

    # Load module dynamically using importlib
    spec = importlib.util.spec_from_file_location(alias_name, full_path)
    if spec and spec.loader:
        module = importlib.util.module_from_spec(spec)
        sys.modules[alias_name] = module
        spec.loader.exec_module(module)

        # Attach module attribute onto parent subpackage
        if len(parts) > 1:
            parent_mod = sys.modules[".".join(parts[:-1])]
            setattr(parent_mod, parts[-1], module)

# 3. Register all Lambda handler modules across Backend/functions/
LAMBDA_MODULES = [
    ("functions.service_request.handler", "functions/service-request/handler.py"),
    ("functions.service_job.handler", "functions/service-job/handler.py"),
    ("functions.attachment.handler", "functions/attachment/handler.py"),
    ("functions.technician.handler", "functions/technician/handler.py"),
    ("functions.report.handler", "functions/report/handler.py"),
    ("functions.customer.handler", "functions/customer/handler.py"),
    ("functions.asset.handler", "functions/asset/handler.py"),
]

for alias, path in LAMBDA_MODULES:
    register_lambda_module(alias, path)
