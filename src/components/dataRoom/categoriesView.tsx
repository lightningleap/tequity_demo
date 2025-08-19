import React from 'react';
import { ChevronDown, ChevronRight, File, Folder, FileText, Search, Hash, Calendar, DollarSign, Users, Percent, Eye, EyeOff } from 'lucide-react';

// Types
interface Document {
  document_name: string;
  link: string;
  metadata: Record<string, any>;
}

interface CategoryData {
  [subcategory: string]: Document[];
}

interface CategoriesData {
  [category: string]: CategoryData;
}

// Enhanced sample data with complex nested structures
const categoriesData = {
    "Corporate": {
      "Cap Table": [
        {
          "document_name": "Cap_Table_2025-08-01.xlsx",
          "link": "/data/Cap_Table_2025-08-01.xlsx",
          "metadata": {
            "as_of_date": "2025-08-01",
            "total_fully_diluted_shares": 10000000,
            "pre_money_valuation": 45000000,
            "post_money_valuation": 50000000,
            "shareholders": [
              {
                "name": "Alice Ventures LLC",
                "class": "Series A Preferred",
                "shares": 1500000,
                "fd_ownership_pct": 15.0,
                "price_per_share": 10.00,
                "invested_amount": 15000000
              },
              {
                "name": "Bob Capital",
                "class": "Common",
                "shares": 2000000,
                "fd_ownership_pct": 20.0
              }
            ],
            "option_pool": {
              "authorized": 1000000,
              "unissued": 600000
            }
          }
        }
      ]
    },
    "Financial": {
      "Monthly Financial Statements": [
        {
          "document_name": "Monthly_Financials_2023-2025.xlsx",
          "link": "/data/Monthly_Financials_2023-2025.xlsx",
          "metadata": {
            "period": "Jan 2023 – Dec 2024",
            "revenue_total": 8200000,
            "cogs_total": 3000000,
            "operating_expenses_total": 2500000,
            "net_income_total": 2700000,
            "balance_sheet": {
              "assets": 12000000,
              "liabilities": 5000000,
              "equity": 7000000
            },
            "cash_flow": {
              "from_operations": 2200000,
              "from_investing": -800000,
              "from_financing": 500000
            }
          }
        }
      ],
      "YTD Financial Statements": [
        {
          "document_name": "YTD_Financials_2025-06-30.xlsx",
          "link": "/data/YTD_Financials_2025-06-30.xlsx",
          "metadata": {
            "period": "Jan 2025 – Jun 2025",
            "revenue_ytd": 4000000,
            "net_income_ytd": 1200000,
            "variance_vs_budget_pct": 5.0
          }
        }
      ],
      "Financial Projections": [
        {
          "document_name": "Financial_Projections_2025-2030.xlsx",
          "link": "/data/Financial_Projections_2025-2030.xlsx",
          "metadata": {
            "projection_years": [2025, 2026, 2027, 2028, 2029, 2030],
            "annual_revenue_forecast": {
              "2025": 8500000,
              "2026": 12000000,
              "2027": 17000000,
              "2028": 24000000,
              "2029": 32000000,
              "2030": 42000000
            },
            "gross_margin_pct": 65,
            "ebitda_margin_pct": 25,
            "headcount_plan": {
              "2025": 45,
              "2026": 60,
              "2027": 80
            },
            "funding_required": 15000000,
            "runway_months": 24
          }
        }
      ]
    },
    "Customers": {
      "Revenue by Customer": [
        {
          "document_name": "Revenue_By_Customer_2022-2024.xlsx",
          "link": "/data/Revenue_By_Customer_2022-2024.xlsx",
          "metadata": {
            "top_customers": [
              {"name": "Acme Corp", "annual_revenue": 1500000, "pct_total_revenue": 18.0, "industry": "Retail", "geo": "US"},
              {"name": "GlobalTech", "annual_revenue": 1200000, "pct_total_revenue": 14.0, "industry": "Technology", "geo": "EU"}
            ],
            "customer_count": 55
          }
        }
      ],
      "Customer Contracts": [
        {
          "document_name": "Customer_Contracts_Summary.xlsx",
          "link": "/data/Customer_Contracts_Summary.xlsx",
          "metadata": {
            "contracts": [
              {"customer": "Acme Corp", "start_date": "2023-01-01", "end_date": "2026-01-01", "value": 5000000, "status": "Active", "renewal_terms": "Annual Auto-Renew"},
              {"customer": "GlobalTech", "start_date": "2022-07-01", "end_date": "2025-07-01", "value": 3000000, "status": "Active"}
            ]
          }
        }
      ]
    },
    "Vendors": {
      "Vendor Contracts": [
        {
          "document_name": "Vendor_Contracts_Summary.xlsx",
          "link": "/data/Vendor_Contracts_Summary.xlsx",
          "metadata": {
            "contracts": [
              {"vendor": "AWS", "service": "Cloud Hosting", "annual_spend": 200000, "status": "Active"},
              {"vendor": "ZoomInfo", "service": "Data Services", "annual_spend": 50000, "status": "Expired"}
            ]
          }
        }
      ]
    },
    "Receivables": {
      "AR Aging": [
        {
          "document_name": "AR_Aging_2025-08-01.xlsx",
          "link": "/data/AR_Aging_2025-08-01.xlsx",
          "metadata": {
            "total_outstanding": 750000,
            "aging_buckets": {
              "0-30": 400000,
              "31-60": 200000,
              "61-90": 100000,
              "90+": 50000
            }
          }
        }
      ]
    },
    "Payables": {
      "AP Aging": [
        {
          "document_name": "AP_Aging_2025-08-01.xlsx",
          "link": "/data/AP_Aging_2025-08-01.xlsx",
          "metadata": {
            "total_liabilities": 560000,
            "aging_buckets": {
              "0-30": 300000,
              "31-60": 150000,
              "61-90": 70000,
              "90+": 40000
            }
          }
        }
      ]
    },
    "Equity": {
      "Stock Option Grants": [
        {
          "document_name": "Stock_Option_Grants_Summary.xlsx",
          "link": "/data/Stock_Option_Grants_Summary.xlsx",
          "metadata": {
            "total_grants": 20,
            "options_outstanding": 400000,
            "grants": [
              {"grantee": "Jane Doe", "grant_date": "2023-01-15", "shares": 20000, "strike_price": 5.0, "vest_schedule": "4 years monthly", "status": "Active"},
              {"grantee": "John Smith", "grant_date": "2024-03-10", "shares": 15000, "strike_price": 6.0, "vest_schedule": "4 years annual", "status": "Active"}
            ]
          }
        }
      ]
    }
  }

const CategoriesView: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({});
  const [expandedSubcategories, setExpandedSubcategories] = React.useState<Record<string, boolean>>({});
  const [expandedObjects, setExpandedObjects] = React.useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = React.useState('');

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleSubcategory = (category: string, subcategory: string) => {
    const key = `${category}-${subcategory}`;
    setExpandedSubcategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleObject = (path: string) => {
    setExpandedObjects((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Enhanced value type detection
  const getValueType = (value: any): { type: string; icon: React.ReactNode; color: string } => {
    if (value === null || value === undefined) {
      return { type: 'null', icon: <Hash className="w-3 h-3" />, color: 'text-gray-400' };
    }
    
    if (typeof value === 'boolean') {
      return { type: 'boolean', icon: <Hash className="w-3 h-3" />, color: 'text-purple-600' };
    }
    
    if (typeof value === 'number') {
      if (value > 1000000) {
        return { type: 'currency', icon: <DollarSign className="w-3 h-3" />, color: 'text-green-600' };
      }
      if (value < 1 && value > 0) {
        return { type: 'percentage', icon: <Percent className="w-3 h-3" />, color: 'text-blue-600' };
      }
      return { type: 'number', icon: <Hash className="w-3 h-3" />, color: 'text-blue-600' };
    }
    
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        return { type: 'date', icon: <Calendar className="w-3 h-3" />, color: 'text-orange-600' };
      }
      if (value.includes('@')) {
        return { type: 'email', icon: <Users className="w-3 h-3" />, color: 'text-indigo-600' };
      }
      return { type: 'string', icon: <FileText className="w-3 h-3" />, color: 'text-gray-700' };
    }
    
    if (Array.isArray(value)) {
      return { type: 'array', icon: <Hash className="w-3 h-3" />, color: 'text-red-600' };
    }
    
    if (typeof value === 'object') {
      return { type: 'object', icon: <Folder className="w-3 h-3" />, color: 'text-blue-500' };
    }
    
    return { type: 'unknown', icon: <Hash className="w-3 h-3" />, color: 'text-gray-500' };
  };

  // Enhanced value formatting
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    
    if (typeof value === 'number') {
      if (value > 1000000) {
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      }
      if (value < 1 && value > 0) {
        return `${(value * 100).toFixed(1)}%`;
      }
      if (Number.isInteger(value)) {
        return new Intl.NumberFormat('en-US').format(value);
      }
      return value.toFixed(2);
    }
    
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    
    return String(value);
  };

  // Enhanced metadata renderer with better collapsibility and styling
  const renderMetadata = (metadata: any, path: string = '', level: number = 0): React.ReactNode => {
    if (metadata === null || metadata === undefined) {
      const { icon, color } = getValueType(metadata);
      return (
        <div className="flex items-center space-x-1">
          <span className={color}>{icon}</span>
          <span className="text-gray-400 font-mono">null</span>
        </div>
      );
    }

    // Handle arrays
    if (Array.isArray(metadata)) {
      if (metadata.length === 0) {
        return (
          <div className="flex items-center space-x-1">
            <Hash className="w-3 h-3 text-red-600" />
            <span className="text-gray-500 font-mono">[]</span>
          </div>
        );
      }

      const arrayPath = `${path}_array`;
      const isExpanded = expandedObjects[arrayPath];

      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => toggleObject(arrayPath)}
              className="flex items-center space-x-1 hover:bg-gray-100 rounded px-1 py-0.5"
            >
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <Hash className="w-3 h-3 text-red-600" />
              <span className="text-sm font-medium text-gray-600">
                Array ({metadata.length} items)
              </span>
            </button>
          </div>
          
          {isExpanded && (
            <div className="ml-4 border-l-2 border-red-200 pl-3 space-y-2">
              {metadata.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-mono text-gray-400">[{index}]</span>
                  </div>
                  <div className="ml-4">
                    {renderMetadata(item, `${arrayPath}_${index}`, level + 1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Handle objects
    if (typeof metadata === 'object') {
      const entries = Object.entries(metadata);
      if (entries.length === 0) {
        return (
          <div className="flex items-center space-x-1">
            <Folder className="w-3 h-3 text-blue-500" />
            <span className="text-gray-500 font-mono">{'{}'}</span>
          </div>
        );
      }

      const objPath = `${path}_obj`;
      const isExpanded = expandedObjects[objPath];

      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => toggleObject(objPath)}
              className="flex items-center space-x-1 hover:bg-gray-100 rounded px-1 py-0.5"
            >
              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <Folder className="w-3 h-3 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">
                Object ({entries.length} properties)
              </span>
            </button>
          </div>
          
          {isExpanded && (
            <div className="ml-4 border-l-2 border-blue-200 pl-3 space-y-2">
              {entries.map(([key, value]) => {
                const { icon, color } = getValueType(value);
                const keyPath = `${objPath}_${key}`;
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-start space-x-2">
                      <div className="flex items-center space-x-1 min-w-0">
                        <span className={color}>{icon}</span>
                        <span className="font-medium text-gray-800 text-sm">
                          {key.replace(/_/g, ' ')}:
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {(typeof value === 'object' && value !== null) || Array.isArray(value) ? (
                          renderMetadata(value, keyPath, level + 1)
                        ) : (
                          <span className={`${color} font-mono text-sm break-all`}>
                            {formatValue(value)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Handle primitive values
    const { icon, color } = getValueType(metadata);
    return (
      <div className="flex items-center space-x-1">
        <span className={color}>{icon}</span>
        <span className={`${color} font-mono text-sm`}>
          {formatValue(metadata)}
        </span>
      </div>
    );
  };

  // Enhanced search filter
  const filterCategories = (data: CategoriesData, query: string): CategoriesData => {
    if (!query.trim()) return data;

    const searchLower = query.toLowerCase();
    const result: CategoriesData = {};

    const searchInValue = (value: any): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.toLowerCase().includes(searchLower);
      if (typeof value === 'number') return value.toString().includes(searchLower);
      if (typeof value === 'boolean') return value.toString().includes(searchLower);
      if (Array.isArray(value)) return value.some(item => searchInValue(item));
      if (typeof value === 'object') {
        return Object.values(value).some(val => searchInValue(val));
      }
      return false;
    };

    Object.entries(data).forEach(([category, subcategories]) => {
      const filteredSubcategories: CategoryData = {};

      Object.entries(subcategories).forEach(([subcategory, documents]) => {
        const matchingDocuments = documents.filter(
          (doc) =>
            doc.document_name.toLowerCase().includes(searchLower) ||
            searchInValue(doc.metadata)
        );

        if (matchingDocuments.length > 0) {
          filteredSubcategories[subcategory] = matchingDocuments;
        }
      });

      if (Object.keys(filteredSubcategories).length > 0) {
        result[category] = filteredSubcategories;
      } else if (category.toLowerCase().includes(searchLower)) {
        result[category] = subcategories;
      }
    });

    return result;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with Search */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Room Categories</h2>
          <p className="text-gray-600 mt-1">Browse and search through all documents and metadata</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents and metadata..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{Object.keys(categoriesData).length}</div>
          <div className="text-gray-600">Categories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {Object.values(categoriesData).reduce((acc, cat) => acc + Object.keys(cat).length, 0)}
          </div>
          <div className="text-gray-600">Subcategories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {Object.values(categoriesData).reduce((acc, cat) => 
              acc + Object.values(cat).reduce((subAcc, docs) => subAcc + docs.length, 0), 0
            )}
          </div>
          <div className="text-gray-600">Documents</div>
        </div>
      </div>

      {/* Categories Tree */}
      <div className="space-y-2">
        {Object.entries(filterCategories(categoriesData, searchQuery)).map(([category, subcategories]) => (
          <div key={category} className="border rounded-lg overflow-hidden shadow-sm bg-white">
            {/* Category Header */}
            <button
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-left font-medium flex items-center transition-all duration-200"
              onClick={() => toggleCategory(category)}
            >
              {expandedCategories[category] ? (
                <ChevronDown className="w-5 h-5 mr-2 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 mr-2 text-gray-600" />
              )}
              <Folder className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-gray-900">{category}</span>
              <span className="ml-auto text-sm text-gray-500">
                {Object.keys(subcategories).length} subcategories
              </span>
            </button>

            {/* Subcategories */}
            {expandedCategories[category] && (
              <div className="px-4 py-2 bg-gray-50">
                <div className="space-y-2">
                  {Object.entries(subcategories).map(([subcategory, documents]) => (
                    <div key={subcategory} className="bg-white rounded-lg border">
                      <button
                        className="w-full px-4 py-3 text-left font-medium flex items-center hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => toggleSubcategory(category, subcategory)}
                      >
                        {expandedSubcategories[`${category}-${subcategory}`] ? (
                          <ChevronDown className="w-4 h-4 mr-2 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 mr-2 text-gray-600" />
                        )}
                        <FileText className="w-4 h-4 mr-2 text-blue-400" />
                        <span className="text-gray-800">{subcategory}</span>
                        <span className="ml-auto text-sm text-gray-500">
                          {documents.length} documents
                        </span>
                      </button>

                      {/* Documents */}
                      {expandedSubcategories[`${category}-${subcategory}`] && (
                        <div className="px-4 pb-4 space-y-3">
                          {documents.map((doc, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                              <div className="flex items-center mb-3">
                                <File className="w-4 h-4 mr-2 text-gray-500" />
                                <a
                                  href={doc.link}
                                  className="text-blue-600 hover:underline font-medium"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {doc.document_name}
                                </a>
                              </div>
                              <div className="pl-6">
                                {renderMetadata(doc.metadata, `${category}-${subcategory}-${index}`)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {searchQuery && Object.keys(filterCategories(categoriesData, searchQuery)).length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No results found for "{searchQuery}"</div>
          <div className="text-gray-500 mt-2">Try adjusting your search terms</div>
        </div>
      )}
    </div>
  );
};

export default CategoriesView;